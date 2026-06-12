const { Sucursal, Consultorio, Configuracion, DiaInhabilitado } = require('../models/index')
const { Op } = require('sequelize')

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
      where[Op.or] = [
        { sucursal_id: req.query.sucursal_id },
        { sucursal_id: null },
      ]
    }
    if (req.query.desde || req.query.hasta) {
      const fechaWhere = {}
      if (req.query.desde) fechaWhere[Op.gte] = req.query.desde
      if (req.query.hasta) fechaWhere[Op.lte] = req.query.hasta
      where.fecha = fechaWhere
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

async function crearDiaInhabilitado(req, res, next) {
  try {
    const { fecha, sucursal_id, motivo, tipo } = req.body
    if (!fecha) return res.status(400).json({ message: 'fecha es obligatoria' })
    const dia = await DiaInhabilitado.create({
      fecha,
      sucursal_id: sucursal_id || null,
      motivo: motivo || null,
      tipo: tipo || 'otro',
    })
    res.status(201).json(dia)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listarSucursales,
  listarConsultorios,
  obtenerConfiguracion,
  listarDiasInhabilitados,
  crearDiaInhabilitado,
}
