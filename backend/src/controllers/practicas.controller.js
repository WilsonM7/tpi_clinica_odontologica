const { Practica, Especialidad } = require('../models/index')

async function generarCodigo() {
  const ultima = await Practica.findOne({
    order: [['codigo', 'DESC']],
    attributes: ['codigo'],
  })
  if (!ultima) return '00001'
  const num = parseInt(ultima.codigo) || 0
  return (num + 1).toString().padStart(5, '0')
}

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.activa !== undefined) {
      where.activa = req.query.activa === 'true'
    }
    const practicas = await Practica.findAll({
      where,
      include: [{ model: Especialidad, as: 'especialidad' }],
      order: [['codigo', 'ASC']],
    })
    res.json(practicas)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const practica = await Practica.findByPk(req.params.id, {
      include: [{ model: Especialidad, as: 'especialidad' }],
    })
    if (!practica) return res.status(404).json({ message: 'Práctica no encontrada' })
    res.json(practica)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, valor, especialidad_id, cobra_descartable, costo_mecanico, multa, tipo_multa } = req.body
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: 'El nombre es obligatorio' })
    }
    const codigo = await generarCodigo()
    const practica = await Practica.create({
      codigo,
      nombre: nombre.trim(),
      valor: valor ?? 0,
      especialidad_id: especialidad_id || null,
      cobra_descartable: cobra_descartable ?? false,
      costo_mecanico: costo_mecanico || null,
      multa: multa || null,
      tipo_multa: tipo_multa || null,
      activa: true,
    })
    res.status(201).json(practica)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const practica = await Practica.findByPk(req.params.id)
    if (!practica) return res.status(404).json({ message: 'Práctica no encontrada' })
    // eslint-disable-next-line no-unused-vars
    const { codigo, ...datos } = req.body
    await practica.update(datos)
    res.json(practica)
  } catch (err) {
    next(err)
  }
}

async function desactivar(req, res, next) {
  try {
    const practica = await Practica.findByPk(req.params.id)
    if (!practica) return res.status(404).json({ message: 'Práctica no encontrada' })
    await practica.update({ activa: false })
    res.json({ message: 'Práctica desactivada' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar, desactivar }
