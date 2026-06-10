const express = require('express')
const cors = require('cors')
const routes = require('./routes/index')

const app = express()

// CORS: permite requests desde el frontend de Vite en desarrollo
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173', // vite preview
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sin origin (ej: Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origen no permitido por CORS: ${origin}`))
      }
    },
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Todas las rutas bajo /api
app.use('/api', routes)

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
})

// Manejo global de errores
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ status: 'error', message: err.message || 'Error interno del servidor' })
})

module.exports = app
