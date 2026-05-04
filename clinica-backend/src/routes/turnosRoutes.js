const express = require('express')
const router = express.Router()
const { getTurnos, getTurnosPaciente, createTurno, updateTurno, deleteTurno } = require('../controllers/turnosController')

router.get('/', getTurnos)
router.get('/paciente/:id', getTurnosPaciente)
router.post('/', createTurno)
router.put('/:id', updateTurno)
router.delete('/:id', deleteTurno)

module.exports = router