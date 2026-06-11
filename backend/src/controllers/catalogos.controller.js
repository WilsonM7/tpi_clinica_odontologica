const { Sucursal, Consultorio, Configuracion, DiaInhabilitado } = require('../models/index')

async function listarSucursales(req, res, next) {
  try {
    const sucursales = await Sucursal.findAll({
      where: { activa: true },
      include: [{ model: Consultorio, as: 'consultorios', where: { activo: true }, required: false }],
      order: [['nombre', 'ASC']],
    })
    res.json(sucursales)
  } catch (err) {
    next(err)
  }
}

async function listarConsultorios(req, res, next) {
  try {
    const where = { activo: true }
    if (req.query.sucursal_id) where.sucursal_id = req.query.sucursal_id
    const consultorios = await Consultorio.findAll({
      where,
      include: [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }],
      order: [['nombre', 'ASC']],
    })
    res.json(consultorios)
  } catch (err) {
    next(err)
  }
}

async function obtenerConfiguracion(req, res, next) {
  try {
    const items = await Configuracion.findAll({ order: [['clave', 'ASC']] })
    // Devuelve como objeto clave->valor para fácil consumo en el frontend
    const config = {}
    items.forEach(item => { config[item.clave] = item.valor })
    res.json(config)
  } catch (err) {
    next(err)
  }
}

async function listarDiasInhabilitados(req, res, next) {
  try {
    const where = {}
    if (req.query.sucursal_id) {
      const { Op } = require('sequelize')
      where.sucursal_id = { [Op.or]: [req.query.sucursal_id, null] }
    }
    if (req.query.desde) {
      const { Op } = require('sequelize')
      where.fecha = { [Op.gte]: req.query.desde }
    }
    const dias = await DiaInhabilitado.findAll({
      where,
      order: [['fecha', 'ASC']],
    })
    res.json(dias)
  } catch (err) {
    next(err)
  }
}

module.exports = { listarSucursales, listarConsultorios, obtenerConfiguracion, listarDiasInhabilitados }
