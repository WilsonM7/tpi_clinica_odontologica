const { Router } = require('express')
const { listar, obtener, actualizar } = require('../controllers/profesionales.controller')

const router = Router()

router.get('/', listar)
router.get('/:id', obtener)
router.put('/:id', actualizar)

module.exports = router
