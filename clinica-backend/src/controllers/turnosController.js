const db = require('../db')

const getTurnos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, 
        u.nombre as paciente_nombre, 
        tr.nombre as tratamiento_nombre
      FROM turnos t
      LEFT JOIN usuarios u ON t.id_paciente = u.id
      LEFT JOIN tratamientos tr ON t.id_tratamiento = tr.id
    `)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos' })
  }
}

const getTurnosPaciente = async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.query(`
      SELECT t.*, tr.nombre as tratamiento_nombre
      FROM turnos t
      LEFT JOIN tratamientos tr ON t.id_tratamiento = tr.id
      WHERE t.id_paciente = ?
    `, [id])
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos' })
  }
}

const createTurno = async (req, res) => {
  const { fecha, hora, id_paciente, id_tratamiento } = req.body
  if (!fecha || !hora || !id_paciente || !id_tratamiento)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  try {
    await db.query(
      'INSERT INTO turnos (fecha, hora, id_paciente, id_tratamiento) VALUES (?, ?, ?, ?)',
      [fecha, hora, id_paciente, id_tratamiento]
    )
    res.json({ mensaje: 'Turno creado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al crear turno' })
  }
}

const updateTurno = async (req, res) => {
  const { id } = req.params
  const { fecha, hora, estado, id_tratamiento } = req.body
  try {
    await db.query(
      'UPDATE turnos SET fecha=?, hora=?, estado=?, id_tratamiento=? WHERE id=?',
      [fecha, hora, estado, id_tratamiento, id]
    )
    res.json({ mensaje: 'Turno actualizado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar turno' })
  }
}

const deleteTurno = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM turnos WHERE id=?', [id])
    res.json({ mensaje: 'Turno eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar turno' })
  }
}

module.exports = { getTurnos, getTurnosPaciente, createTurno, updateTurno, deleteTurno }