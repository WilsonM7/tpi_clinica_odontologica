const db = require('../db')
const ExcelJS = require('exceljs')
const fs = require('fs')

const importarPacientes = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' })

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(req.file.path)
    const sheet = workbook.getWorksheet('BASE DD')

    if (!sheet) return res.status(400).json({ error: 'No se encontró la pestaña BASE DD' })

    // Obtener headers de la primera fila
    const headers = []
    sheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value
    })

    let importados = 0
    let omitidos = 0
    let errores = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // saltar encabezados
    })

    const filas = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const fila = {}
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber]
        if (header) {
          // Resolver valor de celda
          let val = cell.value
          if (val && typeof val === 'object' && val.result !== undefined) val = val.result
          if (val && typeof val === 'object' && val.text !== undefined) val = val.text
          fila[header] = val ?? null
        }
      })
      filas.push(fila)
    })

    for (const fila of filas) {
      const dni = fila['DNI'] ? String(Math.round(Number(fila['DNI']))) : null
      const nombre = fila['Apellido y Nombre'] || null
      const email = fila['E-mail'] || null
      const telefono = fila['Telefono'] ? String(Math.round(Number(fila['Telefono']))) : null

      let fechaNac = null
      const rawFecha = fila['F. Nac']
      if (rawFecha instanceof Date) {
        fechaNac = rawFecha.toISOString().split('T')[0]
      } else if (typeof rawFecha === 'number') {
        // ExcelJS a veces devuelve número serial de Excel
        const date = new Date(Math.round((rawFecha - 25569) * 86400 * 1000))
        fechaNac = date.toISOString().split('T')[0]
      }

      if (!nombre) { omitidos++; continue }

      const emailFinal = email || `paciente_${dni || Date.now()}@clinica.com`

      try {
        const [existe] = await db.query(
          'SELECT id FROM usuarios WHERE dni = ? OR email = ?',
          [dni, emailFinal]
        )

        if (existe.length > 0) { omitidos++; continue }

        await db.query(
          'INSERT INTO usuarios (nombre, email, password, rol, dni, telefono, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [nombre, emailFinal, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'paciente', dni, telefono, fechaNac]
        )
        importados++
      } catch (err) {
        errores.push(`${nombre}: ${err.message}`)
      }
    }

    fs.unlinkSync(req.file.path)

    res.json({
      mensaje: `Importación completada`,
      importados,
      omitidos,
      errores: errores.slice(0, 10)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { importarPacientes }