const { Router } = require('express')
const authRoutes = require('./auth.routes')
const healthRoutes = require('./health.routes')
const practicasRoutes = require('./practicas.routes')
const especialidadesRoutes = require('./especialidades.routes')
const pacientesRoutes = require('./pacientes.routes')
const usuariosRoutes = require('./usuarios.routes')
const profesionalesRoutes = require('./profesionales.routes')
const tratamientosRoutes = require('./tratamientos.routes')
const turnosRoutes = require('./turnos.routes')
const ordenLlegadaRoutes = require('./orden-llegada.routes')
const catalogosRoutes = require('./catalogos.routes')
const horariosRoutes = require('./horarios.routes')
const { requireAuth } = require('../middleware/auth.middleware')

const router = Router()

// Rutas públicas (no requieren token)
router.use('/auth', authRoutes)
router.use('/health', healthRoutes)

// Todas las rutas siguientes requieren JWT válido
router.use(requireAuth)

router.use('/practicas', practicasRoutes)
router.use('/especialidades', especialidadesRoutes)
router.use('/pacientes', pacientesRoutes)
router.use('/usuarios', usuariosRoutes)
router.use('/profesionales', profesionalesRoutes)
router.use('/tratamientos', tratamientosRoutes)
router.use('/turnos', turnosRoutes)
router.use('/orden-llegada', ordenLlegadaRoutes)

// Catálogos: sucursales, consultorios, configuracion, dias-inhabilitados
router.use('/', catalogosRoutes)

// Horarios y ausencias de profesionales
router.use('/', horariosRoutes)

module.exports = router
