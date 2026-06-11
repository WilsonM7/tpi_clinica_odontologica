const { Router } = require('express')
const { listar, obtener, crear, actualizar } = require('../controllers/tratamientos.controller')

const router = Router()

router.get('/', listar)
router.get('/:id', obtener)
router.post('/', crear)
router.put('/:id', actualizar)

module.exports = router
