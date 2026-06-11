const { Router } = require('express')
const healthRoutes = require('./health.routes')
const practicasRoutes = require('./practicas.routes')
const especialidadesRoutes = require('./especialidades.routes')
const pacientesRoutes = require('./pacientes.routes')
const usuariosRoutes = require('./usuarios.routes')
const profesionalesRoutes = require('./profesionales.routes')
const tratamientosRoutes = require('./tratamientos.routes')
const cobrosRoutes = require('./cobros.routes')
const turnosRoutes = require('./turnos.routes')
const ordenLlegadaRoutes = require('./orden-llegada.routes')
const catalogosRoutes = require('./catalogos.routes')

const router = Router()

router.use('/health', healthRoutes)
router.use('/practicas', practicasRoutes)
router.use('/especialidades', especialidadesRoutes)
router.use('/pacientes', pacientesRoutes)
router.use('/usuarios', usuariosRoutes)
router.use('/profesionales', profesionalesRoutes)
router.use('/tratamientos', tratamientosRoutes)
router.use('/cobros', cobrosRoutes)
router.use('/turnos', turnosRoutes)
router.use('/orden-llegada', ordenLlegadaRoutes)

// Catálogos: sucursales, consultorios, configuracion, dias-inhabilitados
router.use('/', catalogosRoutes)

module.exports = router
