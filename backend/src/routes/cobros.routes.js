const { Router } = require('express')
const { listar, crear } = require('../controllers/cobros.controller')

const router = Router()

router.get('/', listar)
router.post('/', crear)

module.exports = router
