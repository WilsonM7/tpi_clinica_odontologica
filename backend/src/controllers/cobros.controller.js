const { Cobro, Paciente, Tratamiento } = require('../models/index')

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.paciente_id) where.paciente_id = req.query.paciente_id
    if (req.query.tratamiento_id) where.tratamiento_id = req.query.tratamiento_id
    const cobros = await Cobro.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni'] },
        { model: Tratamiento, as: 'tratamiento', attributes: ['id', 'fecha', 'estado', 'monto'] },
      ],
      order: [['fecha', 'DESC']],
    })
    res.json(cobros)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { paciente_id, tratamiento_id, monto, fecha, medio_pago, descripcion } = req.body
    if (!paciente_id || monto === undefined || monto === null || !fecha) {
      return res.status(400).json({ message: 'paciente_id, monto y fecha son obligatorios' })
    }
    const paciente = await Paciente.findByPk(paciente_id)
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' })
    const cobro = await Cobro.create({
      paciente_id,
      tratamiento_id: tratamiento_id || null,
      monto: parseFloat(monto),
      fecha,
      medio_pago: medio_pago || null,
      descripcion: descripcion || null,
    })
    res.status(201).json(cobro)
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, crear }
