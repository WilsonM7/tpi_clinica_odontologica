const { Router } = require('express')
const healthRoutes = require('./health.routes')
const practicasRoutes = require('./practicas.routes')
const especialidadesRoutes = require('./especialidades.routes')

const router = Router()

router.use('/health', healthRoutes)
router.use('/practicas', practicasRoutes)
router.use('/especialidades', especialidadesRoutes)

module.exports = router
