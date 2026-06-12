const { Router } = require('express')
const { listarHorarios, listarAusencias } = require('../controllers/horarios.controller')

const router = Router()

router.get('/horarios-profesionales', listarHorarios)
router.get('/ausencias-profesionales', listarAusencias)

module.exports = router
