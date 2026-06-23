const { Router } = require('express')
const { listar, obtener, crear, actualizar, actualizarEspecialidades, actualizarPorcentajes } = require('../controllers/profesionales.controller')

const router = Router()

router.get('/', listar)
router.get('/:id', obtener)
router.post('/', crear)
router.put('/:id', actualizar)
router.put('/:id/especialidades', actualizarEspecialidades)
router.put('/:id/porcentajes', actualizarPorcentajes)

module.exports = router
