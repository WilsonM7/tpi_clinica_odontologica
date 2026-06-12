const { Usuario } = require('../models/index')
const { Op } = require('sequelize')

const ROLES_VALIDOS = ['admin', 'recepcionista', 'profesional']

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.activo !== undefined) {
      where.activo = req.query.activo === 'true'
    }
    const usuarios = await Usuario.findAll({
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    })
    res.json(usuarios)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(usuario)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, apellido, email, rol } = req.body
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Nombre, apellido y email son obligatorios' })
    }
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` })
    }
    const existe = await Usuario.findOne({ where: { email: email.toLowerCase() } })
    if (existe) return res.status(409).json({ message: 'Ya existe un usuario con ese email' })
    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      rol: rol || 'recepcionista',
      activo: true,
    })
    res.status(201).json(usuario)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    const { nombre, apellido, email, rol, activo } = req.body
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` })
    }
    if (email && email !== usuario.email) {
      const existe = await Usuario.findOne({ where: { email: email.toLowerCase(), id: { [Op.ne]: usuario.id } } })
      if (existe) return res.status(409).json({ message: 'Ya existe un usuario con ese email' })
    }
    await usuario.update({
      nombre: nombre?.trim() ?? usuario.nombre,
      apellido: apellido?.trim() ?? usuario.apellido,
      email: email?.toLowerCase().trim() ?? usuario.email,
      rol: rol ?? usuario.rol,
      activo: activo ?? usuario.activo,
    })
    res.json(usuario)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    await usuario.update({ activo: false })
    res.json({ message: 'Usuario desactivado' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar }
