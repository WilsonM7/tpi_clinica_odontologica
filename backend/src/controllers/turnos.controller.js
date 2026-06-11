const { Turno, Paciente, Profesional, Consultorio, Sucursal } = require('../models/index')
const { Op } = require('sequelize')

const INCLUDE_COMPLETO = [
  { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono'] },
  { model: Profesional, as: 'profesional', attributes: ['id', 'nombre', 'apellido', 'matricula'] },
  { model: Consultorio, as: 'consultorio', attributes: ['id', 'nombre'] },
  { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
]

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.fecha) where.fecha = req.query.fecha
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id
    if (req.query.paciente_id) where.paciente_id = req.query.paciente_id
    if (req.query.estado) where.estado = req.query.estado
    const turnos = await Turno.findAll({
      where,
      include: INCLUDE_COMPLETO,
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
    })
    res.json(turnos)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const turno = await Turno.findByPk(req.params.id, { include: INCLUDE_COMPLETO })
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' })
    res.json(turno)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { paciente_id, profesional_id, consultorio_id, sucursal_id, fecha, hora_inicio, hora_fin, estado, observaciones } = req.body
    if (!paciente_id || !profesional_id || !fecha || !hora_inicio) {
      return res.status(400).json({ message: 'paciente_id, profesional_id, fecha y hora_inicio son obligatorios' })
    }
    const conflicto = await Turno.findOne({
      where: {
        profesional_id,
        fecha,
        hora_inicio,
        estado: { [Op.notIn]: ['cancelado'] },
      },
    })
    if (conflicto) {
      return res.status(409).json({ message: 'El profesional ya tiene un turno en ese horario' })
    }
    const turno = await Turno.create({
      paciente_id,
      profesional_id,
      consultorio_id: consultorio_id || null,
      sucursal_id: sucursal_id || null,
      fecha,
      hora_inicio,
      hora_fin: hora_fin || null,
      estado: estado || 'pendiente',
      observaciones: observaciones || null,
    })
    res.status(201).json(turno)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const turno = await Turno.findByPk(req.params.id)
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' })
    const { consultorio_id, sucursal_id, fecha, hora_inicio, hora_fin, estado, observaciones } = req.body
    await turno.update({
      consultorio_id: consultorio_id ?? turno.consultorio_id,
      sucursal_id: sucursal_id ?? turno.sucursal_id,
      fecha: fecha ?? turno.fecha,
      hora_inicio: hora_inicio ?? turno.hora_inicio,
      hora_fin: hora_fin ?? turno.hora_fin,
      estado: estado ?? turno.estado,
      observaciones: observaciones ?? turno.observaciones,
    })
    res.json(turno)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    const turno = await Turno.findByPk(req.params.id)
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' })
    await turno.update({ estado: 'cancelado' })
    res.json({ message: 'Turno cancelado' })
  } catch (err) {
    next(err)
  }
}

async function disponibilidad(req, res, next) {
  try {
    const { profesional_id, fecha } = req.query
    if (!profesional_id || !fecha) {
      return res.status(400).json({ message: 'profesional_id y fecha son obligatorios' })
    }
    const turnos = await Turno.findAll({
      where: {
        profesional_id,
        fecha,
        estado: { [Op.notIn]: ['cancelado'] },
      },
      attributes: ['hora_inicio', 'hora_fin', 'estado'],
      order: [['hora_inicio', 'ASC']],
    })
    res.json({ fecha, profesional_id, turnos_ocupados: turnos })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, disponibilidad }
