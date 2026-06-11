const { Especialidad } = require('../models/index')

async function listar(req, res, next) {
  try {
    const especialidades = await Especialidad.findAll({
      where: { activa: true },
      order: [['nombre', 'ASC']],
    })
    res.json(especialidades)
  } catch (err) {
    next(err)
  }
}

module.exports = { listar }
