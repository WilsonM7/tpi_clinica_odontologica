const { Tratamiento, Paciente, Profesional, Practica } = require('../models/index')

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.paciente_id) where.paciente_id = req.query.paciente_id
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id
    if (req.query.estado) where.estado = req.query.estado
    const tratamientos = await Tratamiento.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
        { model: Profesional, as: 'profesional', attributes: ['id', 'nombre', 'apellido'] },
        { model: Practica, as: 'practica', attributes: ['id', 'codigo', 'nombre', 'valor'] },
      ],
      order: [['fecha', 'DESC']],
    })
    res.json(tratamientos)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const tratamiento = await Tratamiento.findByPk(req.params.id, {
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
        { model: Profesional, as: 'profesional', attributes: ['id', 'nombre', 'apellido'] },
        { model: Practica, as: 'practica' },
      ],
    })
    if (!tratamiento) return res.status(404).json({ message: 'Tratamiento no encontrado' })
    res.json(tratamiento)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { paciente_id, profesional_id, practica_id, fecha, estado, monto, observaciones } = req.body
    if (!paciente_id || !fecha) {
      return res.status(400).json({ message: 'paciente_id y fecha son obligatorios' })
    }
    const paciente = await Paciente.findByPk(paciente_id)
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' })
    const tratamiento = await Tratamiento.create({
      paciente_id,
      profesional_id: profesional_id || null,
      practica_id: practica_id || null,
      fecha,
      estado: estado || 'pendiente',
      monto: monto ?? null,
      observaciones: observaciones || null,
    })
    res.status(201).json(tratamiento)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const tratamiento = await Tratamiento.findByPk(req.params.id)
    if (!tratamiento) return res.status(404).json({ message: 'Tratamiento no encontrado' })
    const { profesional_id, practica_id, fecha, estado, monto, observaciones } = req.body
    await tratamiento.update({
      profesional_id: profesional_id ?? tratamiento.profesional_id,
      practica_id: practica_id ?? tratamiento.practica_id,
      fecha: fecha ?? tratamiento.fecha,
      estado: estado ?? tratamiento.estado,
      monto: monto ?? tratamiento.monto,
      observaciones: observaciones ?? tratamiento.observaciones,
    })
    res.json(tratamiento)
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar }
