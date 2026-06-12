const { Paciente } = require('../models/index')
const { Op } = require('sequelize')

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.activo !== undefined) {
      where.activo = req.query.activo === 'true'
    }
    if (req.query.busqueda) {
      const q = `%${req.query.busqueda}%`
      where[Op.or] = [
        { nombre: { [Op.like]: q } },
        { apellido: { [Op.like]: q } },
        { dni: { [Op.like]: q } },
      ]
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined
    const pacientes = await Paciente.findAll({
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      limit,
    })
    res.json(pacientes)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const paciente = await Paciente.findByPk(req.params.id)
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' })
    res.json(paciente)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, apellido, dni, fecha_nacimiento, telefono, email, direccion, obra_social, numero_afiliado } = req.body
    if (!nombre?.trim() || !apellido?.trim()) {
      return res.status(400).json({ message: 'Nombre y apellido son obligatorios' })
    }
    if (dni) {
      const existe = await Paciente.findOne({ where: { dni } })
      if (existe) return res.status(409).json({ message: 'Ya existe un paciente con ese DNI' })
    }
    const paciente = await Paciente.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni || null,
      fecha_nacimiento: fecha_nacimiento || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      obra_social: obra_social || null,
      numero_afiliado: numero_afiliado || null,
      activo: true,
    })
    res.status(201).json(paciente)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const paciente = await Paciente.findByPk(req.params.id)
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' })
    const { nombre, apellido, dni, fecha_nacimiento, telefono, email, direccion, obra_social, numero_afiliado, activo } = req.body
    if (dni && dni !== paciente.dni) {
      const existe = await Paciente.findOne({ where: { dni, id: { [Op.ne]: paciente.id } } })
      if (existe) return res.status(409).json({ message: 'Ya existe un paciente con ese DNI' })
    }
    await paciente.update({
      nombre: nombre?.trim() ?? paciente.nombre,
      apellido: apellido?.trim() ?? paciente.apellido,
      dni: dni ?? paciente.dni,
      fecha_nacimiento: fecha_nacimiento ?? paciente.fecha_nacimiento,
      telefono: telefono ?? paciente.telefono,
      email: email ?? paciente.email,
      direccion: direccion ?? paciente.direccion,
      obra_social: obra_social ?? paciente.obra_social,
      numero_afiliado: numero_afiliado ?? paciente.numero_afiliado,
      activo: activo ?? paciente.activo,
    })
    res.json(paciente)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    const paciente = await Paciente.findByPk(req.params.id)
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' })
    await paciente.update({ activo: false })
    res.json({ message: 'Paciente desactivado' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar }
