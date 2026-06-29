require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const bcrypt = require('bcryptjs')
const {
  sequelize,
  Especialidad,
  Practica,
  Sucursal,
  Consultorio,
  Paciente,
  Usuario,
  Profesional,
  ProfesionalEspecialidad,
  ProfesionalHorario,
  Tratamiento,
  Turno,
  OrdenLlegada,
  Configuracion,
  DiaInhabilitado,
} = require('../models/index')

async function seed() {
  // force:true recrea todas las tablas con el esquema actualizado
  await sequelize.sync({ force: true })

  // ── Especialidades ────────────────────────────────────────────────────────
  const ortodoncia = await Especialidad.create({ nombre: 'Ortodoncia', activa: true })
  const ortopedia = await Especialidad.create({ nombre: 'Ortopedia', activa: true })
  const general = await Especialidad.create({ nombre: 'General', activa: true })
  console.log('✅ Especialidades listas')

  // ── Prácticas ─────────────────────────────────────────────────────────────
  const practica1 = await Practica.create({ codigo: '00001', nombre: 'Control Ortodoncia', valor: 5000, especialidad_id: ortodoncia.id, cobra_descartable: true, activa: true })
  await Practica.create({ codigo: '00002', nombre: 'Instalación Metálicos', valor: 50000, especialidad_id: ortodoncia.id, cobra_descartable: false, activa: true })
  await Practica.create({ codigo: '00003', nombre: 'Instalación Porcelana', valor: 80000, especialidad_id: ortopedia.id, cobra_descartable: false, activa: true })
  const practica4 = await Practica.create({ codigo: '00004', nombre: 'Limpieza Dental', valor: 8000, especialidad_id: general.id, cobra_descartable: false, activa: true })
  await Practica.create({ codigo: '00005', nombre: 'Extracción Simple', valor: 12000, especialidad_id: general.id, cobra_descartable: true, activa: true })
  console.log('✅ Prácticas listas')

  // ── Sucursales ────────────────────────────────────────────────────────────
  // Una sola sucursal principal para esta entrega
  const sucursalCentro = await Sucursal.create({ nombre: 'Sede Central', direccion: 'Av. Colón 1234', telefono: '0351-4000000', activa: true })
  console.log('✅ Sucursal lista')

  // ── Consultorios ──────────────────────────────────────────────────────────
  const consultorio1 = await Consultorio.create({ nombre: 'Consultorio 1', sucursal_id: sucursalCentro.id, activo: true })
  const consultorio2 = await Consultorio.create({ nombre: 'Consultorio 2', sucursal_id: sucursalCentro.id, activo: true })
  const consultorio3 = await Consultorio.create({ nombre: 'Consultorio 3', sucursal_id: sucursalCentro.id, activo: true })
  console.log('✅ Consultorios listos')

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('clinica123', 10)
  const usuarioAdmin = await Usuario.create({ email: 'admin@clinica.com', nombre: 'Admin', apellido: 'Sistema', rol: 'admin', activo: true, sucursal_id: sucursalCentro.id, password: hash })
  await Usuario.create({ email: 'recepcion@clinica.com', nombre: 'Laura', apellido: 'Gómez', rol: 'recepcionista', activo: true, sucursal_id: sucursalCentro.id, password: hash })
  const usuarioPro1 = await Usuario.create({ email: 'dr.perez@clinica.com', nombre: 'Carlos', apellido: 'Pérez', rol: 'profesional', activo: true, sucursal_id: sucursalCentro.id, password: hash })
  const usuarioPro2 = await Usuario.create({ email: 'dra.lopez@clinica.com', nombre: 'María', apellido: 'López', rol: 'profesional', activo: true, sucursal_id: sucursalCentro.id, password: hash })
  console.log('✅ Usuarios listos (contraseña: clinica123)')

  // ── Profesionales ─────────────────────────────────────────────────────────
  const prof1 = await Profesional.create({
    nombre: 'Carlos', apellido: 'Pérez', dni: '20111222', telefono: '0351-5000001',
    email: 'dr.perez@clinica.com', matricula: 'MP-12345', usuario_id: usuarioPro1.id, activo: true,
  })
  const prof2 = await Profesional.create({
    nombre: 'María', apellido: 'López', dni: '25333444', telefono: '0351-5000002',
    email: 'dra.lopez@clinica.com', matricula: 'MP-67890', usuario_id: usuarioPro2.id, activo: true,
  })
  console.log('✅ Profesionales listos')

  // ── ProfesionalEspecialidad ───────────────────────────────────────────────
  await ProfesionalEspecialidad.create({ profesional_id: prof1.id, especialidad_id: ortodoncia.id })
  await ProfesionalEspecialidad.create({ profesional_id: prof1.id, especialidad_id: general.id })
  await ProfesionalEspecialidad.create({ profesional_id: prof2.id, especialidad_id: ortopedia.id })
  await ProfesionalEspecialidad.create({ profesional_id: prof2.id, especialidad_id: general.id })
  console.log('✅ Especialidades de profesionales listas')

  // ── Horarios ──────────────────────────────────────────────────────────────
  // prof1: lunes a viernes 08:00-13:00
  for (const dia of [1, 2, 3, 4, 5]) {
    await ProfesionalHorario.create({
      profesional_id: prof1.id, dia_semana: dia,
      hora_inicio: '08:00', hora_fin: '13:00',
      consultorio_id: consultorio1.id, sucursal_id: sucursalCentro.id,
    })
  }
  // prof2: lunes, miércoles, viernes 14:00-19:00
  for (const dia of [1, 3, 5]) {
    await ProfesionalHorario.create({
      profesional_id: prof2.id, dia_semana: dia,
      hora_inicio: '14:00', hora_fin: '19:00',
      consultorio_id: consultorio2.id, sucursal_id: sucursalCentro.id,
    })
  }
  console.log('✅ Horarios listos')

  // ── Pacientes ─────────────────────────────────────────────────────────────
  const pac1 = await Paciente.create({
    nombre: 'Juan', apellido: 'García', dni: '30555666', fecha_nacimiento: '1990-05-15',
    telefono: '3512000001', email: 'juan.garcia@mail.com', obra_social: 'OSDE', activo: true,
  })
  const pac2 = await Paciente.create({
    nombre: 'Ana', apellido: 'Martínez', dni: '35777888', fecha_nacimiento: '1995-08-22',
    telefono: '3512000002', email: 'ana.martinez@mail.com', activo: true,
  })
  const pac3 = await Paciente.create({
    nombre: 'Roberto', apellido: 'Fernández', dni: '28999000', fecha_nacimiento: '1985-12-01',
    telefono: '3512000003', obra_social: 'Swiss Medical', activo: true,
  })
  const pac4 = await Paciente.create({
    nombre: 'Lucía', apellido: 'Torres', dni: '40123456', fecha_nacimiento: '2000-03-10',
    telefono: '3512000004', activo: true,
  })
  console.log('✅ Pacientes listos')

  // ── Configuración ─────────────────────────────────────────────────────────
  const configs = [
    { clave: 'nombre_clinica', valor: 'Clínica Odontológica', descripcion: 'Nombre de la clínica' },
    { clave: 'duracion_turno_minutos', valor: '30', descripcion: 'Duración predeterminada de un turno en minutos' },
    { clave: 'hora_apertura', valor: '08:00', descripcion: 'Hora de apertura general' },
    { clave: 'hora_cierre', valor: '19:45', descripcion: 'Hora de cierre general' },
    { clave: 'moneda', valor: 'ARS', descripcion: 'Moneda utilizada' },
  ]
  for (const cfg of configs) {
    await Configuracion.create(cfg)
  }
  console.log('✅ Configuración lista')

  // ── Días inhabilitados ────────────────────────────────────────────────────
  await DiaInhabilitado.create({ fecha: '2026-07-09', motivo: 'Día de la Independencia', tipo: 'feriado', sucursal_id: null })
  await DiaInhabilitado.create({ fecha: '2026-08-17', motivo: 'Paso a la Inmortalidad del Gral. San Martín', tipo: 'feriado', sucursal_id: null })
  console.log('✅ Días inhabilitados listos')

  // ── Tratamientos ──────────────────────────────────────────────────────────
  const trat1 = await Tratamiento.create({
    paciente_id: pac1.id, profesional_id: prof1.id, practica_id: practica1.id,
    fecha: '2026-06-01', estado: 'realizado', monto: 5000, observaciones: 'Primera sesión',
  })
  const trat2 = await Tratamiento.create({
    paciente_id: pac2.id, profesional_id: prof2.id, practica_id: practica4.id,
    fecha: '2026-06-05', estado: 'pendiente', monto: 8000,
  })
  console.log('✅ Tratamientos listos')


  // ── Turnos ────────────────────────────────────────────────────────────────
  // Semana actual: 2026-06-09 (lun) al 2026-06-13 (vie)
  // prof1 trabaja lun-vie 08:00-13:00
  await Turno.create({
    paciente_id: pac1.id, profesional_id: prof1.id, consultorio_id: consultorio1.id,
    sucursal_id: sucursalCentro.id, practica_id: practica1.id,
    fecha: '2026-06-09', hora_inicio: '09:00', hora_fin: '09:30', duracion_minutos: 30,
    estado: 'atendido', notas: 'Control de rutina',
  })
  await Turno.create({
    paciente_id: pac2.id, profesional_id: prof1.id, consultorio_id: consultorio1.id,
    sucursal_id: sucursalCentro.id, practica_id: practica4.id,
    fecha: '2026-06-10', hora_inicio: '10:00', hora_fin: '10:30', duracion_minutos: 30,
    estado: 'confirmado',
  })
  await Turno.create({
    paciente_id: pac3.id, profesional_id: prof1.id, consultorio_id: consultorio1.id,
    sucursal_id: sucursalCentro.id,
    fecha: '2026-06-12', hora_inicio: '08:30', hora_fin: '09:00', duracion_minutos: 30,
    estado: 'agendado', notas: 'Primera consulta',
  })
  await Turno.create({
    paciente_id: pac4.id, profesional_id: prof1.id, consultorio_id: consultorio1.id,
    sucursal_id: sucursalCentro.id,
    fecha: '2026-06-13', hora_inicio: '11:00', hora_fin: '11:30', duracion_minutos: 30,
    estado: 'agendado',
  })
  // prof2 trabaja lun, mié, vie 14:00-19:00
  await Turno.create({
    paciente_id: pac2.id, profesional_id: prof2.id, consultorio_id: consultorio2.id,
    sucursal_id: sucursalCentro.id,
    fecha: '2026-06-09', hora_inicio: '14:00', hora_fin: '14:30', duracion_minutos: 30,
    estado: 'atendido',
  })
  await Turno.create({
    paciente_id: pac1.id, profesional_id: prof2.id, consultorio_id: consultorio2.id,
    sucursal_id: sucursalCentro.id,
    fecha: '2026-06-11', hora_inicio: '15:00', hora_fin: '15:30', duracion_minutos: 30,
    estado: 'confirmado',
  })
  await Turno.create({
    paciente_id: pac3.id, profesional_id: prof2.id, consultorio_id: consultorio2.id,
    sucursal_id: sucursalCentro.id,
    fecha: '2026-06-13', hora_inicio: '16:00', hora_fin: '16:30', duracion_minutos: 30,
    estado: 'agendado',
  })
  // Próxima semana
  await Turno.create({
    paciente_id: pac1.id, profesional_id: prof1.id, consultorio_id: consultorio1.id,
    sucursal_id: sucursalCentro.id, practica_id: practica1.id,
    fecha: '2026-06-16', hora_inicio: '09:00', hora_fin: '09:30', duracion_minutos: 30,
    estado: 'agendado',
  })
  await Turno.create({
    paciente_id: pac2.id, profesional_id: prof2.id, consultorio_id: consultorio2.id,
    sucursal_id: sucursalCentro.id,
    fecha: '2026-06-16', hora_inicio: '14:00', hora_fin: '14:30', duracion_minutos: 30,
    estado: 'pendiente',
  })
  await Turno.create({
    paciente_id: pac4.id, profesional_id: prof1.id, consultorio_id: consultorio1.id,
    sucursal_id: sucursalCentro.id,
    fecha: '2026-06-17', hora_inicio: '10:00', hora_fin: '10:30', duracion_minutos: 30,
    estado: 'agendado',
  })
  console.log('✅ Turnos listos')

  // ── Orden de llegada ──────────────────────────────────────────────────────
  const hoy = new Date().toISOString().slice(0, 10)
  await OrdenLlegada.create({
    paciente_id: pac3.id, profesional_id: prof1.id, fecha: hoy,
    hora_llegada: '08:25', numero_orden: 1, estado: 'esperando',
  })
  console.log('✅ Orden de llegada lista')

  console.log('\n🎉 Seed completado exitosamente')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
