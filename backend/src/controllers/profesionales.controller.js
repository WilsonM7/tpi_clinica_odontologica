const {
  Profesional, ProfesionalEspecialidad, ProfesionalHorario,
  ProfesionalPorcentajeEspecialidad, ProfesionalAusencia,
  Especialidad, Usuario, Sucursal,
} = require('../models/index')

const INCLUDE_FULL = [
  {
    model: ProfesionalEspecialidad,
    as: 'especialidades',
    include: [{ model: Especialidad, as: 'especialidad' }],
  },
  {
    model: ProfesionalPorcentajeEspecialidad,
    as: 'porcentajes',
    include: [{ model: Especialidad, as: 'especialidad' }],
  },
  { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email', 'rol'] },
]

async function listar(req, res, next) {
  try {
    const where = {}
    if (req.query.activo !== undefined) where.activo = req.query.activo === 'true'
    if (req.query.usuario_id) where.usuario_id = req.query.usuario_id

    const profesionales = await Profesional.findAll({
      where,
      include: INCLUDE_FULL,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    })
    res.json(profesionales)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const profesional = await Profesional.findByPk(req.params.id, { include: INCLUDE_FULL })
    if (!profesional) return res.status(404).json({ message: 'Profesional no encontrado' })
    res.json(profesional)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, apellido, dni, telefono, email, matricula, usuario_id, activo, nombre_corto } = req.body
    if (!nombre?.trim() || !apellido?.trim()) {
      return res.status(400).json({ message: 'Nombre y apellido son obligatorios' })
    }
    const profesional = await Profesional.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni || null,
      telefono: telefono || null,
      email: email || null,
      matricula: matricula || null,
      usuario_id: usuario_id || null,
      activo: activo ?? true,
      nombre_corto: nombre_corto || null,
    })
    const con = await Profesional.findByPk(profesional.id, { include: INCLUDE_FULL })
    res.status(201).json(con)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const profesional = await Profesional.findByPk(req.params.id)
    if (!profesional) return res.status(404).json({ message: 'Profesional no encontrado' })
    const { nombre, apellido, dni, telefono, email, matricula, usuario_id, activo, nombre_corto, porcentaje_instalacion, porcentaje_practicas } = req.body
    await profesional.update({
      nombre: nombre?.trim() ?? profesional.nombre,
      apellido: apellido?.trim() ?? profesional.apellido,
      dni: dni ?? profesional.dni,
      telefono: telefono ?? profesional.telefono,
      email: email ?? profesional.email,
      matricula: matricula ?? profesional.matricula,
      usuario_id: usuario_id ?? profesional.usuario_id,
      activo: activo ?? profesional.activo,
      nombre_corto: nombre_corto !== undefined ? nombre_corto : profesional.nombre_corto,
      porcentaje_instalacion: porcentaje_instalacion !== undefined ? porcentaje_instalacion : profesional.porcentaje_instalacion,
      porcentaje_practicas: porcentaje_practicas !== undefined ? porcentaje_practicas : profesional.porcentaje_practicas,
    })
    const con = await Profesional.findByPk(profesional.id, { include: INCLUDE_FULL })
    res.json(con)
  } catch (err) {
    next(err)
  }
}

async function actualizarEspecialidades(req, res, next) {
  try {
    const { id } = req.params
    const profesional = await Profesional.findByPk(id)
    if (!profesional) return res.status(404).json({ message: 'Profesional no encontrado' })

    const { especialidades } = req.body // array de especialidad_id
    await ProfesionalEspecialidad.destroy({ where: { profesional_id: id } })
    if (Array.isArray(especialidades) && especialidades.length > 0) {
      await ProfesionalEspecialidad.bulkCreate(
        especialidades.map(espId => ({ profesional_id: id, especialidad_id: espId }))
      )
    }
    res.json({ message: 'Especialidades actualizadas' })
  } catch (err) {
    next(err)
  }
}

async function actualizarPorcentajes(req, res, next) {
  try {
    const { id } = req.params
    const profesional = await Profesional.findByPk(id)
    if (!profesional) return res.status(404).json({ message: 'Profesional no encontrado' })

    const { porcentajes } = req.body // array de { especialidad_id, porcentaje }
    await ProfesionalPorcentajeEspecialidad.destroy({ where: { profesional_id: id } })
    if (Array.isArray(porcentajes) && porcentajes.length > 0) {
      const validos = porcentajes.filter(p => p.especialidad_id && p.porcentaje > 0)
      if (validos.length > 0) {
        await ProfesionalPorcentajeEspecialidad.bulkCreate(
          validos.map(p => ({ profesional_id: id, especialidad_id: p.especialidad_id, porcentaje: p.porcentaje }))
        )
      }
    }
    res.json({ message: 'Porcentajes actualizados' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar, actualizarEspecialidades, actualizarPorcentajes }
