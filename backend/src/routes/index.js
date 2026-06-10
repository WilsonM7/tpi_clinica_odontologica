const { Router } = require('express')
const healthRoutes = require('./health.routes')

// Las rutas de cada módulo se irán incorporando aquí en próximas fases:
//   const pacientesRoutes = require('./pacientes.routes')
//   const cobrosRoutes    = require('./cobros.routes')
//   const turnosRoutes    = require('./turnos.routes')
//   const practicasRoutes = require('./practicas.routes')
//   const usuariosRoutes  = require('./usuarios.routes')
//   const authRoutes      = require('./auth.routes')

const router = Router()

router.use('/health', healthRoutes)

module.exports = router
