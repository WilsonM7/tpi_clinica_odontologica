const db = require('../db')

function horarioAplicaEnFecha(horario, fecha) {
  const fechaObj = new Date(fecha)
  const diaSemana = fechaObj.getDay() === 0 ? 6 : fechaObj.getDay() - 1

  if (horario.dia_semana !== diaSemana) return false
  if (horario.frecuencia === 'siempre') return true

  if (horario.frecuencia === 'unica_vez') {
    return horario.fecha_especifica?.split('T')[0] === fecha
  }

  if (horario.frecuencia === 'cada_2_semanas') {
    if (!horario.fecha_especifica) return false
    const inicio = new Date(horario.fecha_especifica)
    const diff = Math.floor((fechaObj - inicio) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff % 14 === 0
  }

  return false
}

const getHorarios = async (req, res) => {
  const { id_profesional } = req.params
  try {
    const [rows] = await db.query('SELECT * FROM horarios WHERE id_profesional = ? AND activo = true', [id_profesional])
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createHorario = async (req, res) => {
  const { id_profesional, dia_semana, hora_inicio, hora_fin, frecuencia, fecha_especifica, espaciado_minutos, duracion_bloque_minutos } = req.body
  if (!id_profesional || dia_semana === undefined || !hora_inicio || !hora_fin)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  try {
    await db.query(
      'INSERT INTO horarios (id_profesional, dia_semana, hora_inicio, hora_fin, frecuencia, fecha_especifica, espaciado_minutos, duracion_bloque_minutos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_profesional, dia_semana, hora_inicio, hora_fin, frecuencia || 'siempre', fecha_especifica || null, espaciado_minutos || null, duracion_bloque_minutos || null]
    )
    res.json({ mensaje: 'Horario creado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateHorario = async (req, res) => {
  const { id } = req.params
  const { dia_semana, hora_inicio, hora_fin, frecuencia, fecha_especifica, espaciado_minutos, duracion_bloque_minutos } = req.body
  try {
    await db.query(
      'UPDATE horarios SET dia_semana=?, hora_inicio=?, hora_fin=?, frecuencia=?, fecha_especifica=?, espaciado_minutos=?, duracion_bloque_minutos=? WHERE id=?',
      [dia_semana, hora_inicio, hora_fin, frecuencia || 'siempre', fecha_especifica || null, espaciado_minutos || null, duracion_bloque_minutos || null, id]
    )
    res.json({ mensaje: 'Horario actualizado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteHorario = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM horarios WHERE id=?', [id])
    res.json({ mensaje: 'Horario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getAusencias = async (req, res) => {
  const { id_profesional } = req.params
  try {
    const [rows] = await db.query('SELECT * FROM ausencias WHERE id_profesional = ?', [id_profesional])
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createAusencia = async (req, res) => {
  const { id_profesional, fecha, motivo } = req.body
  try {
    await db.query('INSERT INTO ausencias (id_profesional, fecha, motivo) VALUES (?, ?, ?)', [id_profesional, fecha, motivo])
    res.json({ mensaje: 'Ausencia registrada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteAusencia = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM ausencias WHERE id=?', [id])
    res.json({ mensaje: 'Ausencia eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getTurnosSemana = async (req, res) => {
  const { id_profesional, fecha_inicio, fecha_fin } = req.query
  try {
    let query = `
      SELECT t.*, u.nombre as paciente_nombre, tr.nombre as tratamiento_nombre
      FROM turnos t
      LEFT JOIN usuarios u ON t.id_paciente = u.id
      LEFT JOIN tratamientos tr ON t.id_tratamiento = tr.id
      WHERE t.fecha BETWEEN ? AND ?
    `
    const params = [fecha_inicio, fecha_fin]
    if (id_profesional) { query += ' AND t.id_profesional = ?'; params.push(id_profesional) }
    query += ' ORDER BY t.fecha, t.hora'
    const [rows] = await db.query(query, params)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const agregarNota = async (req, res) => {
  const { id } = req.params
  const { notas } = req.body
  try {
    await db.query('UPDATE turnos SET notas=? WHERE id=?', [notas, id])
    res.json({ mensaje: 'Nota agregada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getBloquesInhabilitados = async (req, res) => {
  const { id_profesional } = req.params
  try {
    const [rows] = await db.query('SELECT * FROM bloques_inhabilitados WHERE id_profesional = ?', [id_profesional])
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createBloqueInhabilitado = async (req, res) => {
  const { id_profesional, dia_semana, hora_inicio, hora_fin, motivo } = req.body
  try {
    await db.query('INSERT INTO bloques_inhabilitados (id_profesional, dia_semana, hora_inicio, hora_fin, motivo) VALUES (?, ?, ?, ?, ?)', [id_profesional, dia_semana, hora_inicio, hora_fin, motivo || null])
    res.json({ mensaje: 'Bloque inhabilitado creado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateBloqueInhabilitado = async (req, res) => {
  const { id } = req.params
  const { dia_semana, hora_inicio, hora_fin, motivo } = req.body
  try {
    await db.query('UPDATE bloques_inhabilitados SET dia_semana=?, hora_inicio=?, hora_fin=?, motivo=? WHERE id=?', [dia_semana, hora_inicio, hora_fin, motivo, id])
    res.json({ mensaje: 'Bloque actualizado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteBloqueInhabilitado = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM bloques_inhabilitados WHERE id=?', [id])
    res.json({ mensaje: 'Bloque eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getDiasEspecialidad = async (req, res) => {
  const { id_profesional } = req.params
  try {
    const [rows] = await db.query(
      `SELECT de.*, u.nombre as suplente_nombre 
       FROM dias_especialidad de
       LEFT JOIN usuarios u ON de.id_suplente = u.id
       WHERE de.id_profesional = ?`,
      [id_profesional]
    )
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createDiaEspecialidad = async (req, res) => {
  const { id_profesional, fecha, id_suplente, motivo } = req.body
  try {
    await db.query('INSERT INTO dias_especialidad (id_profesional, fecha, id_suplente, motivo) VALUES (?, ?, ?, ?)', [id_profesional, fecha, id_suplente || null, motivo || null])
    if (id_suplente) {
      await db.query('UPDATE turnos SET id_profesional = ? WHERE id_profesional = ? AND fecha = ?', [id_suplente, id_profesional, fecha])
    }
    res.json({ mensaje: 'Día de especialidad registrado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateDiaEspecialidad = async (req, res) => {
  const { id } = req.params
  const { fecha, id_suplente, motivo } = req.body
  try {
    const [old] = await db.query('SELECT * FROM dias_especialidad WHERE id=?', [id])
    if (old.length > 0 && old[0].id_suplente) {
      await db.query('UPDATE turnos SET id_profesional=? WHERE id_profesional=? AND fecha=?', [old[0].id_profesional, old[0].id_suplente, old[0].fecha])
    }
    await db.query('UPDATE dias_especialidad SET fecha=?, id_suplente=?, motivo=? WHERE id=?', [fecha, id_suplente || null, motivo, id])
    if (id_suplente) {
      await db.query('UPDATE turnos SET id_profesional=? WHERE id_profesional=? AND fecha=?', [id_suplente, old[0].id_profesional, fecha])
    }
    res.json({ mensaje: 'Día de especialidad actualizado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteDiaEspecialidad = async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.query('SELECT * FROM dias_especialidad WHERE id = ?', [id])
    if (rows.length > 0 && rows[0].id_suplente) {
      await db.query('UPDATE turnos SET id_profesional = ? WHERE id_profesional = ? AND fecha = ?', [rows[0].id_profesional, rows[0].id_suplente, rows[0].fecha])
    }
    await db.query('DELETE FROM dias_especialidad WHERE id=?', [id])
    res.json({ mensaje: 'Día de especialidad eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getCierres = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cierres_clinica ORDER BY fecha')
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createCierre = async (req, res) => {
  const { fecha, motivo, tipo } = req.body
  if (!fecha || !motivo) return res.status(400).json({ error: 'Fecha y motivo son obligatorios' })
  try {
    await db.query('INSERT INTO cierres_clinica (fecha, motivo, tipo) VALUES (?, ?, ?)', [fecha, motivo, tipo || 'feriado'])
    res.json({ mensaje: 'Cierre registrado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateCierre = async (req, res) => {
  const { id } = req.params
  const { fecha, motivo, tipo } = req.body
  try {
    await db.query('UPDATE cierres_clinica SET fecha=?, motivo=?, tipo=? WHERE id=?', [fecha, motivo, tipo, id])
    res.json({ mensaje: 'Cierre actualizado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteCierre = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM cierres_clinica WHERE id=?', [id])
    res.json({ mensaje: 'Cierre eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { 
  getHorarios, createHorario, deleteHorario, updateHorario,
  getAusencias, createAusencia, deleteAusencia, 
  getTurnosSemana, agregarNota,
  getBloquesInhabilitados, createBloqueInhabilitado, deleteBloqueInhabilitado, updateBloqueInhabilitado,
  getDiasEspecialidad, createDiaEspecialidad, deleteDiaEspecialidad, updateDiaEspecialidad,
  getCierres, createCierre, updateCierre, deleteCierre
}