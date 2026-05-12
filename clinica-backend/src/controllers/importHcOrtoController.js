const db = require('../db')
const ExcelJS = require('exceljs')
const fs = require('fs')

// Mapeo de abreviaturas a nombres completos de profesionales
const OD_MAP = {
  'NERE':  'CABRERA NEREA',
  'FLOR':  'MONTENEGRO FLORENCIA',
  'IRIA':  'WU IRIA',
  'JUAN':  'LATINO JUAN',
  'GIULI': 'IGLESIA GIULIANA',
  'MIRE':  'LONGARINI MIRELLA',
  'LUCIA': 'STANGAFERRO LUCIA',
  'PRI':   'DEVOTO PRISCILA',
  'VICKY': 'MACEROLA VICTORIA',
  'ESTEFI':'TESTERO ESTEFANIA',
  'LARA':  'MICHELETTI LARA',
  'MICA':  'MORANTE MICAELA',
  'HEBE':  'ALLENDE HEBE',
}

// Mapeo de abreviaturas de material a enum de BD
const MAT_MAP = {
  'MET': 'metalico',
  'POR': 'porcelana',
  'ZAF': 'zafiro',
  'INV': 'invisible',
  'ORT': 'ortopedia_klammt', // valor genérico para ortopedia
  'AFL': 'autoligable',
  'BFR': 'baja_friccion',
}

// Convierte texto como "180MIL", "15 MIL", "180mil" a número
const parseMonto = (val) => {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const clean = val.toUpperCase().replace(/\s/g, '').replace('MIL', '000')
    const num = parseFloat(clean)
    return isNaN(num) ? null : num
  }
  return null
}

// Convierte fecha de Excel a string YYYY-MM-DD
const parseDate = (val) => {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    return d.toISOString().split('T')[0]
  }
  return null
}

// Determina si una celda de control es fecha válida o texto (ej: "FEB NO")
const parseFechaControl = (val) => {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    return d.toISOString().split('T')[0]
  }
  // Si es texto como "FEB NO", lo ignoramos
  return null
}

const importarHcOrto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' })

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(req.file.path)
    const sheet = workbook.getWorksheet('HC ORTO')

    if (!sheet) return res.status(400).json({ error: 'No se encontró la pestaña HC ORTO' })

    // Leer headers fila 1
    const headers = []
    sheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value
    })

    // Cargar profesionales y sucursales de la BD
    const [profesionales] = await db.query(`
      SELECT p.id, u.nombre, p.abreviatura
      FROM profesionales p
      JOIN usuarios u ON p.usuario_id = u.id
    `)
    const profMap = {}
    profesionales.forEach(p => {
      profMap[p.abreviatura] = p.id
      profMap[p.nombre] = p.id
    })

    const [sucursales] = await db.query('SELECT id, nombre FROM sucursales')
    const sucMap = {}
    sucursales.forEach(s => {
      sucMap[s.nombre.toUpperCase().substring(0, 3)] = s.id // ROS, FUN
    })

    let importados = 0
    let omitidos = 0
    let errores = []

    // Iterar filas desde la 2
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
    })

    const filas = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = []
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let val = cell.value
        if (val && typeof val === 'object' && val.result !== undefined) val = val.result
        if (val && typeof val === 'object' && val.text !== undefined) val = val.text
        if (val && typeof val === 'object' && val instanceof Date) val = val
        vals[colNumber] = val ?? null
      })
      filas.push(vals)
    })

    for (const row of filas) {
      const nombre = row[1]
      if (!nombre || typeof nombre !== 'string') continue

      const dni = row[2] ? String(Math.round(Number(row[2]))) : null
      const abrevOd = row[3]
      const deuda = typeof row[4] === 'number' ? row[4] : 0
      const sucAbrev = row[5] // ROS o FUN
      const matAbrev = row[6]
      const contrato = row[7] === 'VIG' ? 'vigente' : 'anterior'
      const tipo = row[8] === 'COM' ? 'complejo' : row[8] === 'SIM' ? 'simple' : 'simple'
      const entregaSup = parseMonto(row[9])
      const entregaInf = parseMonto(row[10])
      const cuota = parseMonto(row[11])
      const aumento = parseMonto(row[12])
      // Col 13 (índice 13) = fecha instalación
      const fechaInstalacion = parseDate(row[13])

      // Fechas de controles: columnas 14 en adelante
      const fechasControl = []
      for (let c = 14; c <= row.length; c++) {
        const fecha = parseFechaControl(row[c])
        if (fecha) fechasControl.push(fecha)
      }

      const profesionalId = profMap[abrevOd] || null
      const sucursalId = sucMap[sucAbrev] || null
      const material = MAT_MAP[matAbrev] || null

      try {
        // Buscar paciente por DNI o nombre
        let pacienteId = null
        if (dni) {
          const [byDni] = await db.query('SELECT id FROM usuarios WHERE dni = ?', [dni])
          if (byDni.length > 0) pacienteId = byDni[0].id
        }
        if (!pacienteId) {
          const [byNombre] = await db.query('SELECT id FROM usuarios WHERE nombre = ?', [nombre])
          if (byNombre.length > 0) pacienteId = byNombre[0].id
        }
        // Si no existe, crearlo automáticamente
        if (!pacienteId) {
          const emailFinal = `paciente_${dni || Date.now()}@clinica.com`
          const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [emailFinal])
          if (existing.length > 0) {
            pacienteId = existing[0].id
          } else {
            const [created] = await db.query(
              'INSERT INTO usuarios (nombre, email, password, rol, dni) VALUES (?, ?, ?, "paciente", ?)',
              [nombre, emailFinal, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', dni]
            )
            pacienteId = created.insertId
          }
        }

        // Verificar si ya existe un seguimiento para este paciente con mismo contrato
        const [existe] = await db.query(
          'SELECT id FROM seguimiento_orto WHERE paciente_id = ? AND contrato = ? AND estado = "activo"',
          [pacienteId, contrato]
        )
        if (existe.length > 0) {
          omitidos++
          continue
        }

        // Insertar seguimiento
        const [result] = await db.query(
          `INSERT INTO seguimiento_orto
            (paciente_id, profesional_id, sucursal_id, legajo, estado, contrato, tipo,
             entrega_inicial, entrega_inferior, cuota, aumento, fecha_instalacion, deuda_actual)
           VALUES (?, ?, ?, ?, 'activo', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [pacienteId, profesionalId, sucursalId, dni, contrato, tipo,
           entregaSup, entregaInf, cuota, aumento, fechaInstalacion, deuda]
        )
        const seguimientoId = result.insertId

        // Insertar material
        if (material) {
          await db.query(
            'INSERT INTO seguimiento_materiales (seguimiento_id, material) VALUES (?, ?)',
            [seguimientoId, material]
          )
        }

        // Insertar controles históricos
        for (const fecha of fechasControl) {
          await db.query(
            `INSERT INTO controles_orto (seguimiento_id, fecha, concepto)
             VALUES (?, ?, 'Control histórico importado')`,
            [seguimientoId, fecha]
          )
        }

        importados++
      } catch (err) {
        errores.push(`${nombre}: ${err.message}`)
      }
    }

    fs.unlinkSync(req.file.path)

    res.json({
      mensaje: 'Importación HC ORTO completada',
      importados,
      omitidos,
      errores: errores.slice(0, 20)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { importarHcOrto }