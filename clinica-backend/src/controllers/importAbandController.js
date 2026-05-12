const db = require('../db')
const ExcelJS = require('exceljs')
const fs = require('fs')

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

const MAT_MAP = {
  'MET': 'metalico',
  'POR': 'porcelana',
  'ZAF': 'zafiro',
  'INV': 'invisible',
  'ORT': 'ortopedia_klammt',
  'AFL': 'autoligable',
  'BFR': 'baja_friccion',
}

const SKIP_NOMBRES = new Set(['ROSARIO', 'FUNES', 'PACIENTES', 'F. ABAND'])

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

const parseDate = (val) => {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    return d.toISOString().split('T')[0]
  }
  return null
}

const parseFechaControl = (val) => {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'number' && val > 0) {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    return d.toISOString().split('T')[0]
  }
  return null // texto como "FEB NO" se ignora
}

const importarAband = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' })

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(req.file.path)
    const sheet = workbook.getWorksheet('ABAND')

    if (!sheet) return res.status(400).json({ error: 'No se encontró la pestaña ABAND' })

    // Cargar profesionales y sucursales
    const [profesionales] = await db.query(`
      SELECT p.id, u.nombre, p.abreviatura
      FROM profesionales p JOIN usuarios u ON p.usuario_id = u.id
    `)
    const profMap = {}
    profesionales.forEach(p => {
      profMap[p.abreviatura] = p.id
      profMap[p.nombre] = p.id
    })

    const [sucursales] = await db.query('SELECT id, nombre FROM sucursales')
    const sucMap = {}
    sucursales.forEach(s => {
      sucMap[s.nombre.toUpperCase().substring(0, 3)] = s.id
    })

    let importados = 0
    let omitidos = 0
    let errores = []

    // Leer todas las filas
    const filas = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = []
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let val = cell.value
        if (val && typeof val === 'object' && val.result !== undefined) val = val.result
        if (val && typeof val === 'object' && val.text !== undefined) val = val.text
        vals[colNumber] = val ?? null
      })
      filas.push(vals)
    })

    for (const row of filas) {
      // Col 2 = nombre (ABAND tiene F.ABAND en col 1)
      const nombre = row[2]
      if (!nombre || typeof nombre !== 'string') continue
      if (SKIP_NOMBRES.has(nombre)) continue
      if (typeof nombre === 'number') continue

      const dni = row[3] ? String(Math.round(Number(row[3]))) : null
      const abrevOd = row[4]
      const deuda = typeof row[5] === 'number' ? row[5] : 0
      const sucAbrev = row[6]
      const matAbrev = row[7]
      const contrato = row[8] === 'VIG' ? 'vigente' : 'anterior'
      const tipo = row[9] === 'COM' ? 'complejo' : 'simple'
      const entregaSup = parseMonto(row[10])
      const entregaInf = parseMonto(row[11])
      const cuota = parseMonto(row[12])
      const aumento = parseMonto(row[13])

      // Col 13 = fecha instalación (primer control)
      const fechaInstalacion = parseFechaControl(row[13])

      // Controles desde col 13 en adelante, la última fecha válida = fecha abandono
      const fechasControl = []
      let fechaAbandono = null
      for (let c = 13; c <= row.length; c++) {
        const fecha = parseFechaControl(row[c])
        if (fecha) {
          fechasControl.push(fecha)
          fechaAbandono = fecha // última fecha válida
        }
      }

      const profesionalId = profMap[abrevOd] || null
      const sucursalId = sucMap[sucAbrev] || null
      const material = MAT_MAP[matAbrev] || null

      try {
        // Buscar o crear paciente
        let pacienteId = null
        if (dni) {
          const [byDni] = await db.query('SELECT id FROM usuarios WHERE dni = ?', [dni])
          if (byDni.length > 0) pacienteId = byDni[0].id
        }
        if (!pacienteId) {
          const [byNombre] = await db.query('SELECT id FROM usuarios WHERE nombre = ?', [nombre])
          if (byNombre.length > 0) pacienteId = byNombre[0].id
        }
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

        // Verificar si ya existe este seguimiento abandonado
        const [existe] = await db.query(
          'SELECT id FROM seguimiento_orto WHERE paciente_id = ? AND estado = "abandonado" AND contrato = ?',
          [pacienteId, contrato]
        )
        if (existe.length > 0) { omitidos++; continue }

        // Insertar seguimiento con estado abandonado
        const [result] = await db.query(
          `INSERT INTO seguimiento_orto
            (paciente_id, profesional_id, sucursal_id, legajo, estado, contrato, tipo,
             entrega_inicial, entrega_inferior, cuota, aumento, fecha_instalacion,
             fecha_abandono, deuda_actual)
           VALUES (?, ?, ?, ?, 'abandonado', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [pacienteId, profesionalId, sucursalId, dni, contrato, tipo,
           entregaSup, entregaInf, cuota, aumento, fechaInstalacion,
           fechaAbandono, deuda]
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
             VALUES (?, ?, 'Control histórico ABAND')`,
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
      mensaje: 'Importación ABAND completada',
      importados,
      omitidos,
      errores: errores.slice(0, 20)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { importarAband }