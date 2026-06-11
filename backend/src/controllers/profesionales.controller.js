const { Profesional, ProfesionalEspecialidad, ProfesionalHorario, ProfesionalAusencia, Especialidad, Usuario } = require('../models/index')

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.activo !== undefined) {
      where.activo = req.query.activo === 'true'
    }
    const profesionales = await Profesional.findAll({
      where,
      include: [
        {
          model: ProfesionalEspecialidad,
          as: 'especialidades',
          include: [{ model: Especialidad, as: 'especialidad' }],
        },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email', 'rol'] },
      ],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    })
    res.json(profesionales)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const profesional = await Profesional.findByPk(req.params.id, {
      include: [
        {
          model: ProfesionalEspecialidad,
          as: 'especialidades',
          include: [{ model: Especialidad, as: 'especialidad' }],
        },
        {
          model: ProfesionalHorario,
          as: 'horarios',
        },
        {
          model: ProfesionalAusencia,
          as: 'ausencias',
        },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email', 'rol'] },
      ],
    })
    if (!profesional) return res.status(404).json({ message: 'Profesional no encontrado' })
    res.json(profesional)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const profesional = await Profesional.findByPk(req.params.id)
    if (!profesional) return res.status(404).json({ message: 'Profesional no encontrado' })
    const { nombre, apellido, dni, telefono, email, matricula, usuario_id, activo } = req.body
    await profesional.update({
      nombre: nombre?.trim() ?? profesional.nombre,
      apellido: apellido?.trim() ?? profesional.apellido,
      dni: dni ?? profesional.dni,
      telefono: telefono ?? profesional.telefono,
      email: email ?? profesional.email,
      matricula: matricula ?? profesional.matricula,
      usuario_id: usuario_id ?? profesional.usuario_id,
      activo: activo ?? profesional.activo,
    })
    res.json(profesional)
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, actualizar }
