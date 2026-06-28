const { ProfesionalHorario, ProfesionalAusencia, Sucursal } = require('../models/index')
const { Op } = require('sequelize')

async function listarHorarios(req, res, next) {
  try {
    const where = {}
    if (req.query.sucursal_id) where.sucursal_id = req.query.sucursal_id
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id
    if (req.query.activo !== undefined) where.activo = req.query.activo === 'true'

    const horarios = await ProfesionalHorario.findAll({
      where,
      include: [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }],
      order: [['sucursal_id', 'ASC'], ['dia_semana', 'ASC']],
    })

    const result = horarios.map(h => ({
      ...h.toJSON(),
      sucursales: h.sucursal ? { nombre: h.sucursal.nombre } : null,
    }))
    res.json(result)
  } catch (err) {
    next(err)
  }
}

async function crearHorario(req, res, next) {
  try {
    const { profesional_id, sucursal_id, dia_semana, turno, hora_inicio, hora_fin } = req.body
    if (!profesional_id || dia_semana === undefined || !hora_inicio || !hora_fin) {
      return res.status(400).json({ message: 'profesional_id, dia_semana, hora_inicio y hora_fin son obligatorios' })
    }
    const horario = await ProfesionalHorario.create({
      profesional_id,
      sucursal_id: sucursal_id || null,
      dia_semana,
      turno: turno || null,
      hora_inicio,
      hora_fin,
      activo: true,
    })
    const con = await ProfesionalHorario.findByPk(horario.id, {
      include: [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }],
    })
    res.status(201).json({ ...con.toJSON(), sucursales: con.sucursal ? { nombre: con.sucursal.nombre } : null })
  } catch (err) {
    next(err)
  }
}

async function actualizarHorario(req, res, next) {
  try {
    const horario = await ProfesionalHorario.findByPk(req.params.id)
    if (!horario) return res.status(404).json({ message: 'Horario no encontrado' })
    const { sucursal_id, dia_semana, turno, hora_inicio, hora_fin, activo } = req.body
    await horario.update({
      sucursal_id: sucursal_id !== undefined ? sucursal_id : horario.sucursal_id,
      dia_semana: dia_semana ?? horario.dia_semana,
      turno: turno !== undefined ? turno : horario.turno,
      hora_inicio: hora_inicio ?? horario.hora_inicio,
      hora_fin: hora_fin ?? horario.hora_fin,
      activo: activo ?? horario.activo,
    })
    const con = await ProfesionalHorario.findByPk(horario.id, {
      include: [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }],
    })
    res.json({ ...con.toJSON(), sucursales: con.sucursal ? { nombre: con.sucursal.nombre } : null })
  } catch (err) {
    next(err)
  }
}

async function eliminarHorario(req, res, next) {
  try {
    const horario = await ProfesionalHorario.findByPk(req.params.id)
    if (!horario) return res.status(404).json({ message: 'Horario no encontrado' })
    await horario.destroy()
    res.json({ message: 'Horario eliminado' })
  } catch (err) {
    next(err)
  }
}

async function listarAusencias(req, res, next) {
  try {
    const where = {}
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id

    if (req.query.fecha_desde && req.query.fecha_hasta) {
      where.fecha_inicio = { [Op.lte]: req.query.fecha_hasta }
      where.fecha_fin = { [Op.gte]: req.query.fecha_desde }
    }

    const ausencias = await ProfesionalAusencia.findAll({ where })
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

module.exports = { listarHorarios, crearHorario, actualizarHorario, eliminarHorario, listarAusencias }
