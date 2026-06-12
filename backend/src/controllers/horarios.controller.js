const { ProfesionalHorario, ProfesionalAusencia } = require('../models/index')
const { Op } = require('sequelize')

async function listarHorarios(req, res, next) {
  try {
    const where = {}
    if (req.query.sucursal_id) where.sucursal_id = req.query.sucursal_id
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id

    const horarios = await ProfesionalHorario.findAll({
      where,
      attributes: ['profesional_id', 'dia_semana', 'hora_inicio', 'hora_fin', 'consultorio_id', 'sucursal_id'],
    })
    res.json(horarios)
  } catch (err) {
    next(err)
  }
}

async function listarAusencias(req, res, next) {
  try {
    const where = {}
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id

    // Ausencias que se solapan con el rango dado
    if (req.query.fecha_desde && req.query.fecha_hasta) {
      where.fecha_inicio = { [Op.lte]: req.query.fecha_hasta }
      where.fecha_fin = { [Op.gte]: req.query.fecha_desde }
    }

    const ausencias = await ProfesionalAusencia.findAll({ where })

    // Mapear al formato esperado por el frontend (fecha_inicio→fecha_desde, fecha_fin→fecha_hasta)
    const result = ausencias.map(a => ({
      profesional_id: a.profesional_id,
      fecha_desde: a.fecha_inicio,
      fecha_hasta: a.fecha_fin,
    }))
    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = { listarHorarios, listarAusencias }
