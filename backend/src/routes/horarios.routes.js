const { Router } = require('express')
const { listarHorarios, crearHorario, actualizarHorario, eliminarHorario, listarAusencias } = require('../controllers/horarios.controller')

const router = Router()

router.get('/horarios-profesionales', listarHorarios)
router.post('/horarios-profesionales', crearHorario)
router.put('/horarios-profesionales/:id', actualizarHorario)
router.delete('/horarios-profesionales/:id', eliminarHorario)

router.get('/ausencias-profesionales', listarAusencias)

module.exports = router
