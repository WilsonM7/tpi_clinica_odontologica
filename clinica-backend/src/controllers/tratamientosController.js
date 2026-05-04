const db = require('../db')

const getTratamientos = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tratamientos')
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tratamientos' })
  }
}

const createTratamiento = async (req, res) => {
  const { nombre, descripcion, precio, duracion_minutos } = req.body
  if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio son obligatorios' })
  try {
    await db.query(
      'INSERT INTO tratamientos (nombre, descripcion, precio, duracion_minutos) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, precio, duracion_minutos || 30]
    )
    res.json({ mensaje: 'Tratamiento creado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tratamiento' })
  }
}

const updateTratamiento = async (req, res) => {
  const { id } = req.params
  const { nombre, descripcion, precio, duracion_minutos } = req.body
  try {
    await db.query(
      'UPDATE tratamientos SET nombre=?, descripcion=?, precio=?, duracion_minutos=? WHERE id=?',
      [nombre, descripcion, precio, duracion_minutos, id]
    )
    res.json({ mensaje: 'Tratamiento actualizado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tratamiento' })
  }
}

const deleteTratamiento = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM tratamientos WHERE id=?', [id])
    res.json({ mensaje: 'Tratamiento eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tratamiento' })
  }
}

module.exports = { getTratamientos, createTratamiento, updateTratamiento, deleteTratamiento }