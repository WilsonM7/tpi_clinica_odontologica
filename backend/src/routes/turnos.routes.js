const { Router } = require('express')
const { listar, obtener, crear, actualizar, eliminar, disponibilidad } = require('../controllers/turnos.controller')

const router = Router()

// /disponibilidad debe ir antes de /:id para no ser capturado como parámetro
router.get('/disponibilidad', disponibilidad)
router.get('/', listar)
router.get('/:id', obtener)
router.post('/', crear)
router.put('/:id', actualizar)
router.delete('/:id', eliminar)

module.exports = router
