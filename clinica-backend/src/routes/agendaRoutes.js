const express = require('express')
const router = express.Router()
const { 
  getHorarios, createHorario, deleteHorario, updateHorario,
  getAusencias, createAusencia, deleteAusencia,
  getTurnosSemana, agregarNota,
  getBloquesInhabilitados, createBloqueInhabilitado, deleteBloqueInhabilitado, updateBloqueInhabilitado,
  getDiasEspecialidad, createDiaEspecialidad, deleteDiaEspecialidad, updateDiaEspecialidad,
  getCierres, createCierre, updateCierre, deleteCierre
} = require('../controllers/agendaController')

router.get('/horarios/:id_profesional', getHorarios)
router.post('/horarios', createHorario)
router.put('/horarios/:id', updateHorario)
router.delete('/horarios/:id', deleteHorario)

router.get('/ausencias/:id_profesional', getAusencias)
router.post('/ausencias', createAusencia)
router.delete('/ausencias/:id', deleteAusencia)

router.get('/turnos-semana', getTurnosSemana)
router.put('/nota/:id', agregarNota)

router.get('/bloques/:id_profesional', getBloquesInhabilitados)
router.post('/bloques', createBloqueInhabilitado)
router.put('/bloques/:id', updateBloqueInhabilitado)
router.delete('/bloques/:id', deleteBloqueInhabilitado)

router.get('/especialidad/:id_profesional', getDiasEspecialidad)
router.post('/especialidad', createDiaEspecialidad)
router.put('/especialidad/:id', updateDiaEspecialidad)
router.delete('/especialidad/:id', deleteDiaEspecialidad)

router.get('/cierres', getCierres)
router.post('/cierres', createCierre)
router.put('/cierres/:id', updateCierre)
router.delete('/cierres/:id', deleteCierre)

module.exports = router