const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { Usuario, Sucursal } = require('../models/index')

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre, apellido: user.apellido },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  )
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' })
    }

    const usuario = await Usuario.findOne({ where: { email: email.toLowerCase(), activo: true } })
    if (!usuario) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' })
    }

    const ok = await bcrypt.compare(password, usuario.password || '')
    if (!ok) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' })
    }

    const token = signToken(usuario)
    res.json({
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
    })
  } catch (err) {
    next(err)
  }
}

async function me(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'apellido', 'email', 'rol'],
    })
    if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado' })
    res.json(usuario)
  } catch (err) {
    next(err)
  }
}

module.exports = { login, me }
