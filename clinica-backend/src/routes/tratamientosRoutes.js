const express = require('express')
const router = express.Router()
const { getTratamientos, createTratamiento, updateTratamiento, deleteTratamiento } = require('../controllers/tratamientosController')

router.get('/', getTratamientos)
router.post('/', createTratamiento)
router.put('/:id', updateTratamiento)
router.delete('/:id', deleteTratamiento)

module.exports = router