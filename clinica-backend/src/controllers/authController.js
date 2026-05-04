const db = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  const { nombre, email, password } = req.body
  try {
    const hash = await bcrypt.hash(password, 10)
    await db.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hash]
    )
    res.json({ mensaje: 'Usuario registrado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email])
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' })

    const usuario = rows[0]
    const match = await bcrypt.compare(password, usuario.password)
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' })

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } })
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
}

module.exports = { register, login }