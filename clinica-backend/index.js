const express = require('express')
const cors = require('cors')
require('dotenv').config()
const db = require('./src/db')

const authRoutes = require('./src/routes/authRoutes')
const tratamientosRoutes = require('./src/routes/tratamientosRoutes')
const turnosRoutes = require('./src/routes/turnosRoutes')
const usuariosRoutes = require('./src/routes/usuariosRoutes')
const agendaRoutes = require('./src/routes/agendaRoutes')
const importRoutes = require('./src/routes/importRoutes')
const importHcOrtoRoutes = require('./src/routes/importHcOrtoRoutes')
const importAbandRoutes = require('./src/routes/importAbandRoutes')
const importRetiroRoutes = require('./src/routes/importRetiroRoutes')

const app = express()
const PORT = process.env.PORT || 3000


app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/tratamientos', tratamientosRoutes)
app.use('/api/turnos', turnosRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/agenda', agendaRoutes)
app.use('/api/import', importRoutes)
app.use('/api/import', importHcOrtoRoutes)
app.use('/api/import', importAbandRoutes)
app.use('/api/import', importRetiroRoutes)

app.get('/api/sucursales', async (req, res) => {
  const [rows] = await require('./src/db').query('SELECT * FROM sucursales WHERE activa = 1')
  res.json(rows)
})

app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor de Clínica Odontológica funcionando ✅' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})