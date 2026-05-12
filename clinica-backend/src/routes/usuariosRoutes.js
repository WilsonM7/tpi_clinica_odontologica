const express = require('express')
const router = express.Router()
const { getUsuarios, getProfesionales, createUsuario, updateUsuario, deleteUsuario } = require('../controllers/usuariosController')

router.get('/', getUsuarios)
router.get('/profesionales', getProfesionales)
router.post('/', createUsuario)
router.put('/:id', updateUsuario)
router.delete('/:id', deleteUsuario)

module.exports = router