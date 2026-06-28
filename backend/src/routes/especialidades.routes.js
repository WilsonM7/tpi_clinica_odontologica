const { Router } = require('express')
const { listar } = require('../controllers/especialidades.controller')

const router = Router()

router.get('/', listar)

module.exports = router
