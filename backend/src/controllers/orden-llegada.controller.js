const { OrdenLlegada, Paciente, Profesional } = require('../models/index')
const { Op } = require('sequelize')

async function listar(req, res, next) {
  try {
    const where = {}
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10)
    where.fecha = fecha
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id
    if (req.query.estado) where.estado = req.query.estado
    const ordenes = await OrdenLlegada.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
        { model: Profesional, as: 'profesional', attributes: ['id', 'nombre', 'apellido'] },
      ],
      order: [['numero_orden', 'ASC']],
    })
    res.json(ordenes)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { paciente_id, profesional_id, fecha, hora_llegada } = req.body
    if (!paciente_id || !hora_llegada) {
      return res.status(400).json({ message: 'paciente_id y hora_llegada son obligatorios' })
    }
    const fechaOrden = fecha || new Date().toISOString().slice(0, 10)
    const where = { fecha: fechaOrden }
    if (profesional_id) where.profesional_id = profesional_id
    const ultimo = await OrdenLlegada.findOne({
      where,
      order: [['numero_orden', 'DESC']],
      attributes: ['numero_orden'],
    })
    const numero_orden = (ultimo?.numero_orden ?? 0) + 1
    const orden = await OrdenLlegada.create({
      paciente_id,
      profesional_id: profesional_id || null,
      fecha: fechaOrden,
      hora_llegada,
      numero_orden,
      estado: 'esperando',
    })
    res.status(201).json(orden)
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, crear }
