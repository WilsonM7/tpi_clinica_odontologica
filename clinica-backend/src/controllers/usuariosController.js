const db = require('../db')
const bcrypt = require('bcryptjs')

const getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id, u.nombre, u.email, u.rol, u.color, u.especialidad,
        u.dni, u.telefono, u.fecha_nacimiento, u.domicilio, u.reside,
        u.ocupacion, u.como_nos_conocio, u.fecha_ingreso_sistema,
        u.obra_social, u.numero_afiliado,
        s.id AS sucursal_id, s.nombre AS sucursal_nombre
      FROM usuarios u
      LEFT JOIN profesionales p ON p.usuario_id = u.id
      LEFT JOIN sucursales s ON s.id = p.sucursal_id
    `)
    res.json(rows)
  } catch (error) {
    console.error('ERROR getUsuarios:', error)
    res.status(500).json({ error: error.message })
  }
}

const getProfesionales = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nombre, u.email, u.rol, u.color, u.especialidad,
             p.abreviatura, s.nombre AS sucursal
      FROM usuarios u
      JOIN profesionales p ON p.usuario_id = u.id
      LEFT JOIN sucursales s ON s.id = p.sucursal_id
      WHERE u.rol IN ('profesional','encargada')
    `)
    res.json(rows)
  } catch (error) {
    console.error('ERROR getProfesionales:', error)
    res.status(500).json({ error: error.message })
  }
}

const createUsuario = async (req, res) => {
  const {
    nombre, email, password, rol, color, especialidad,
    dni, telefono, fecha_nacimiento, domicilio, reside,
    ocupacion, como_nos_conocio, fecha_ingreso_sistema,
    obra_social, numero_afiliado, sucursal_id
  } = req.body

  if (!nombre || !email || !password || !rol)
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios' })

  try {
    const hash = await bcrypt.hash(password, 10)
    const [result] = await db.query(
      `INSERT INTO usuarios
        (nombre, email, password, rol, color, especialidad,
         dni, telefono, fecha_nacimiento, domicilio, reside,
         ocupacion, como_nos_conocio, fecha_ingreso_sistema,
         obra_social, numero_afiliado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, email, hash, rol, color || '#3498db', especialidad || null,
        dni || null, telefono || null, fecha_nacimiento || null,
        domicilio || null, reside || null, ocupacion || null,
        como_nos_conocio || null, fecha_ingreso_sistema || null,
        obra_social || null, numero_afiliado || null
      ]
    )

    // Si es profesional o encargada, insertar en tabla profesionales
    if (['profesional', 'encargada'].includes(rol)) {
      await db.query(
        'INSERT INTO profesionales (usuario_id, sucursal_id) VALUES (?, ?)',
        [result.insertId, sucursal_id || null]
      )
    }

    res.json({ mensaje: 'Usuario creado correctamente' })
  } catch (error) {
    console.error('ERROR createUsuario:', error)
    res.status(500).json({ error: error.message })
  }
}

const updateUsuario = async (req, res) => {
  const { id } = req.params
  const {
    nombre, email, rol, color, especialidad,
    dni, telefono, fecha_nacimiento, domicilio, reside,
    ocupacion, como_nos_conocio, fecha_ingreso_sistema,
    obra_social, numero_afiliado, sucursal_id
  } = req.body

  try {
    await db.query(
      `UPDATE usuarios SET
        nombre=?, email=?, rol=?, color=?, especialidad=?,
        dni=?, telefono=?, fecha_nacimiento=?, domicilio=?, reside=?,
        ocupacion=?, como_nos_conocio=?, fecha_ingreso_sistema=?,
        obra_social=?, numero_afiliado=?
       WHERE id=?`,
      [
        nombre, email, rol, color, especialidad,
        dni || null, telefono || null, fecha_nacimiento || null,
        domicilio || null, reside || null, ocupacion || null,
        como_nos_conocio || null, fecha_ingreso_sistema || null,
        obra_social || null, numero_afiliado || null,
        id
      ]
    )

    // Actualizar sucursal si es profesional
    if (['profesional', 'encargada'].includes(rol) && sucursal_id !== undefined) {
      const [prof] = await db.query('SELECT id FROM profesionales WHERE usuario_id = ?', [id])
      if (prof.length > 0) {
        await db.query('UPDATE profesionales SET sucursal_id = ? WHERE usuario_id = ?', [sucursal_id || null, id])
      } else {
        await db.query('INSERT INTO profesionales (usuario_id, sucursal_id) VALUES (?, ?)', [id, sucursal_id || null])
      }
    }

    res.json({ mensaje: 'Usuario actualizado correctamente' })
  } catch (error) {
    console.error('ERROR updateUsuario:', error)
    res.status(500).json({ error: error.message })
  }
}

const deleteUsuario = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM usuarios WHERE id=?', [id])
    res.json({ mensaje: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('ERROR deleteUsuario:', error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getUsuarios, getProfesionales, createUsuario, updateUsuario, deleteUsuario }