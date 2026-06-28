const { Router } = require('express')
const { listar, obtener, crear, actualizar, eliminar } = require('../controllers/usuarios.controller')

const router = Router()

router.get('/', listar)
router.get('/:id', obtener)
router.post('/', crear)
router.put('/:id', actualizar)
router.delete('/:id', eliminar)

module.exports = router
