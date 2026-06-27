const { Turno, Paciente, Profesional, Consultorio, Sucursal, Practica, Usuario } = require('../models/index')
const { Op } = require('sequelize')

const INCLUDE_COMPLETO = [
  { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono'] },
  {
    model: Profesional, as: 'profesional', attributes: ['id', 'nombre', 'apellido', 'matricula', 'usuario_id'],
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }],
  },
  { model: Consultorio, as: 'consultorio', attributes: ['id', 'nombre'] },
  { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
  { model: Practica, as: 'practica', attributes: ['id', 'nombre'] },
]

function formatTurno(t) {
  const raw = t.toJSON ? t.toJSON() : t
  return {
    id: raw.id,
    paciente_id: raw.paciente_id,
    profesional_id: raw.profesional_id,
    consultorio_id: raw.consultorio_id,
    sucursal_id: raw.sucursal_id,
    practica_id: raw.practica_id,
    radiografia: raw.radiografia,
    duracion_minutos: raw.duracion_minutos || 30,
    estado: raw.estado,
    notas: raw.notas,
    fecha_hora: `${raw.fecha}T${raw.hora_inicio}:00`,
    pacientes: raw.paciente ? {
      id: raw.paciente.id,
      apellido_nombre: `${raw.paciente.apellido}, ${raw.paciente.nombre}`,
      telefono: raw.paciente.telefono,
    } : null,
    profesionales: raw.profesional ? {
      id: raw.profesional.id,
      usuario_id: raw.profesional.usuario_id,
      usuarios: {
        nombre: raw.profesional.usuario
          ? `${raw.profesional.usuario.nombre} ${raw.profesional.usuario.apellido}`
          : `${raw.profesional.nombre} ${raw.profesional.apellido}`,
      },
    } : null,
    consultorios: raw.consultorio ? {
      id: raw.consultorio.id,
      nombre: raw.consultorio.nombre,
    } : null,
    practicas: raw.practica ? { nombre: raw.practica.nombre } : null,
  }
}

function parseFechaHora(fechaHora) {
  const sep = fechaHora.indexOf('T')
  const fecha = fechaHora.substring(0, sep)
  const hora_inicio = fechaHora.substring(sep + 1, sep + 6)
  return { fecha, hora_inicio }
}

function calcHoraFin(hora_inicio, duracion_minutos) {
  const [h, m] = hora_inicio.split(':').map(Number)
  const total = h * 60 + m + (duracion_minutos || 30)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

async function listar(req, res, next) {
  try {
    const where = {}

    if (req.query.sucursal_id) where.sucursal_id = req.query.sucursal_id
    if (req.query.profesional_id) where.profesional_id = req.query.profesional_id
    if (req.query.paciente_id) where.paciente_id = req.query.paciente_id
    if (req.query.consultorio_id) where.consultorio_id = req.query.consultorio_id
    if (req.query.estado) where.estado = req.query.estado
    if (req.query.radiografia) where.radiografia = req.query.radiografia
    if (req.query.hora_inicio) where.hora_inicio = req.query.hora_inicio

    if (req.query.fecha) {
      where.fecha = req.query.fecha
    } else if (req.query.fecha_desde || req.query.fecha_hasta) {
      const fechaWhere = {}
      if (req.query.fecha_desde) fechaWhere[Op.gte] = req.query.fecha_desde
      if (req.query.fecha_hasta) fechaWhere[Op.lte] = req.query.fecha_hasta
      where.fecha = fechaWhere
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : undefined
    const ordenDir = req.query.orden === 'desc' ? 'DESC' : 'ASC'

    const turnos = await Turno.findAll({
      where,
      include: INCLUDE_COMPLETO,
      order: [['fecha', ordenDir], ['hora_inicio', ordenDir]],
      limit,
    })

    let resultado = turnos.map(formatTurno)

    if (req.query.busqueda) {
      const q = req.query.busqueda.toLowerCase()
      resultado = resultado.filter(t =>
        t.pacientes?.apellido_nombre?.toLowerCase().includes(q) ||
        t.practicas?.nombre?.toLowerCase().includes(q) ||
        t.profesionales?.usuarios?.nombre?.toLowerCase().includes(q)
      )
    }

    res.json(resultado)
  } catch (err) {
    next(err)
  }
}

async function obtener(req, res, next) {
  try {
    const turno = await Turno.findByPk(req.params.id, { include: INCLUDE_COMPLETO })
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' })
    res.json(formatTurno(turno))
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const {
      paciente_id, profesional_id, consultorio_id, sucursal_id,
      fecha_hora, duracion_minutos, practica_id, radiografia, notas, estado,
    } = req.body

    if (!paciente_id || !profesional_id || !fecha_hora) {
      return res.status(400).json({ message: 'paciente_id, profesional_id y fecha_hora son obligatorios' })
    }

    const { fecha, hora_inicio } = parseFechaHora(fecha_hora)
    const durMin = duracion_minutos || 30
    const hora_fin = calcHoraFin(hora_inicio, durMin)

    const conflicto = await Turno.findOne({
      where: {
        consultorio_id: consultorio_id || null,
        fecha,
        hora_inicio,
        estado: { [Op.notIn]: ['cancelado', 'reprogramado'] },
      },
    })
    if (conflicto) {
      return res.status(409).json({ message: 'Ya existe un turno en ese consultorio a esa hora' })
    }

    let sid = sucursal_id
    if (!sid) {
      const s = await Sucursal.findOne({ where: { activa: true } })
      sid = s?.id
    }

    const turno = await Turno.create({
      paciente_id,
      profesional_id,
      consultorio_id: consultorio_id || null,
      sucursal_id: sid,
      practica_id: practica_id || null,
      fecha,
      hora_inicio,
      hora_fin,
      duracion_minutos: durMin,
      estado: estado || 'agendado',
      notas: notas || null,
      radiografia: radiografia || null,
    })

    const turnoCompleto = await Turno.findByPk(turno.id, { include: INCLUDE_COMPLETO })
    res.status(201).json(formatTurno(turnoCompleto))
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const turno = await Turno.findByPk(req.params.id)
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' })

    const {
      consultorio_id, sucursal_id, fecha_hora, duracion_minutos,
      estado, observaciones, notas, practica_id, radiografia,
    } = req.body

    const updates = {}
    if (estado !== undefined) updates.estado = estado
    if (notas !== undefined) updates.notas = notas
    if (practica_id !== undefined) updates.practica_id = practica_id || null
    if (radiografia !== undefined) updates.radiografia = radiografia || null
    if (observaciones !== undefined) updates.observaciones = observaciones
    if (consultorio_id !== undefined) updates.consultorio_id = consultorio_id
    if (sucursal_id !== undefined) updates.sucursal_id = sucursal_id

    if (fecha_hora) {
      const { fecha, hora_inicio } = parseFechaHora(fecha_hora)
      const durMin = duracion_minutos || turno.duracion_minutos || 30
      updates.fecha = fecha
      updates.hora_inicio = hora_inicio
      updates.hora_fin = calcHoraFin(hora_inicio, durMin)
      updates.duracion_minutos = durMin
    } else if (duracion_minutos !== undefined) {
      updates.duracion_minutos = duracion_minutos
      updates.hora_fin = calcHoraFin(turno.hora_inicio, duracion_minutos)
    }

    await turno.update(updates)
    const turnoActualizado = await Turno.findByPk(turno.id, { include: INCLUDE_COMPLETO })
    res.json(formatTurno(turnoActualizado))
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    const turno = await Turno.findByPk(req.params.id)
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' })
    await turno.destroy()
    res.json({ message: 'Turno eliminado' })
  } catch (err) {
    next(err)
  }
}

async function disponibilidad(req, res, next) {
  try {
    const { profesional_id, fecha } = req.query
    if (!profesional_id || !fecha) {
      return res.status(400).json({ message: 'profesional_id y fecha son obligatorios' })
    }
    const turnos = await Turno.findAll({
      where: {
        profesional_id,
        fecha,
        estado: { [Op.notIn]: ['cancelado', 'reprogramado'] },
      },
      attributes: ['hora_inicio', 'hora_fin', 'estado'],
      order: [['hora_inicio', 'ASC']],
    })
    res.json({ fecha, profesional_id, turnos_ocupados: turnos })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, disponibilidad }
