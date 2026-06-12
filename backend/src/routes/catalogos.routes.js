const { Router } = require('express')
const {
  listarSucursales,
  listarConsultorios,
  obtenerConfiguracion,
  listarDiasInhabilitados,
  crearDiaInhabilitado,
} = require('../controllers/catalogos.controller')

const router = Router()

router.get('/sucursales', listarSucursales)
router.get('/consultorios', listarConsultorios)
router.get('/configuracion', obtenerConfiguracion)
router.get('/dias-inhabilitados', listarDiasInhabilitados)
router.post('/dias-inhabilitados', crearDiaInhabilitado)

module.exports = router
