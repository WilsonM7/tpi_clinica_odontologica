const bcrypt = require('bcryptjs')
const { Usuario, Sucursal } = require('../models/index')
const { Op } = require('sequelize')

const ROLES_VALIDOS = ['admin', 'recepcionista', 'profesional', 'secretaria', 'jefe_clinica', 'super_admin', 'telemarketer', 'asistente', 'supervisora']

const INCLUDE_SUCURSAL = [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'], required: false }]

function formatUsuario(u) {
  const plain = u.toJSON ? u.toJSON() : u
  return {
    ...plain,
    sucursales: plain.sucursal ? { nombre: plain.sucursal.nombre } : null,
  }
}

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.activo !== undefined) {
      where.activo = req.query.activo === 'true'
    }
    const usuarios = await Usuario.findAll({
      where,
      include: INCLUDE_SUCURSAL,
      attributes: { exclude: ['password'] },
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    })
    res.json(usuarios.map(formatUsuario))
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: INCLUDE_SUCURSAL,
      attributes: { exclude: ['password'] },
    })
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(formatUsuario(usuario))
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, apellido, email, rol, password, sucursal_id } = req.body
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Nombre, apellido y email son obligatorios' })
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
    }
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` })
    }
    const existe = await Usuario.findOne({ where: { email: email.toLowerCase() } })
    if (existe) return res.status(409).json({ message: 'Ya existe un usuario con ese email' })

    const hash = await bcrypt.hash(password, 10)
    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      rol: rol || 'recepcionista',
      activo: true,
      sucursal_id: sucursal_id || null,
      password: hash,
    })

    const con = await Usuario.findByPk(usuario.id, { include: INCLUDE_SUCURSAL, attributes: { exclude: ['password'] } })
    res.status(201).json(formatUsuario(con))
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    const { nombre, apellido, email, rol, activo, sucursal_id, password } = req.body
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` })
    }
    if (email && email !== usuario.email) {
      const existe = await Usuario.findOne({ where: { email: email.toLowerCase(), id: { [Op.ne]: usuario.id } } })
      if (existe) return res.status(409).json({ message: 'Ya existe un usuario con ese email' })
    }

    const updates = {
      nombre: nombre?.trim() ?? usuario.nombre,
      apellido: apellido?.trim() ?? usuario.apellido,
      email: email?.toLowerCase().trim() ?? usuario.email,
      rol: rol ?? usuario.rol,
      activo: activo ?? usuario.activo,
      sucursal_id: sucursal_id !== undefined ? sucursal_id : usuario.sucursal_id,
    }
    if (password && password.length >= 6) {
      updates.password = await bcrypt.hash(password, 10)
    }

    await usuario.update(updates)
    const con = await Usuario.findByPk(usuario.id, { include: INCLUDE_SUCURSAL, attributes: { exclude: ['password'] } })
    res.json(formatUsuario(con))
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
    await usuario.destroy()
    res.json({ message: 'Usuario eliminado' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar }
