require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
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
  Cobro,
  Turno,
  OrdenLlegada,
  Configuracion,
  DiaInhabilitado,
} = require('../models/index')

async function seed() {
  await sequelize.sync()

  // ── Especialidades ────────────────────────────────────────────────────────
  const [ortodoncia] = await Especialidad.findOrCreate({
    where: { nombre: 'Ortodoncia' },
    defaults: { activa: true },
  })
  const [ortopedia] = await Especialidad.findOrCreate({
    where: { nombre: 'Ortopedia' },
    defaults: { activa: true },
  })
  const [general] = await Especialidad.findOrCreate({
    where: { nombre: 'General' },
    defaults: { activa: true },
  })
  console.log('✅ Especialidades listas')

  // ── Prácticas ─────────────────────────────────────────────────────────────
  await Practica.findOrCreate({
    where: { codigo: '00001' },
    defaults: { nombre: 'Control Ortodoncia', valor: 5000, especialidad_id: ortodoncia.id, cobra_descartable: true, activa: true },
  })
  await Practica.findOrCreate({
    where: { codigo: '00002' },
    defaults: { nombre: 'Instalación Metálicos', valor: 50000, especialidad_id: ortodoncia.id, cobra_descartable: false, activa: true },
  })
  await Practica.findOrCreate({
    where: { codigo: '00003' },
    defaults: { nombre: 'Instalación Porcelana', valor: 80000, especialidad_id: ortopedia.id, cobra_descartable: false, activa: true },
  })
  await Practica.findOrCreate({
    where: { codigo: '00004' },
    defaults: { nombre: 'Limpieza Dental', valor: 8000, especialidad_id: general.id, cobra_descartable: false, activa: true },
  })
  await Practica.findOrCreate({
    where: { codigo: '00005' },
    defaults: { nombre: 'Extracción Simple', valor: 12000, especialidad_id: general.id, cobra_descartable: true, activa: true },
  })
  console.log('✅ Prácticas listas')

  // ── Sucursales ────────────────────────────────────────────────────────────
  const [sucursalCentro] = await Sucursal.findOrCreate({
    where: { nombre: 'Centro' },
    defaults: { direccion: 'Av. Colón 1234', telefono: '0351-4000000', activa: true },
  })
  const [sucursalNorte] = await Sucursal.findOrCreate({
    where: { nombre: 'Norte' },
    defaults: { direccion: 'Bv. Los Andes 500', telefono: '0351-4111111', activa: true },
  })
  console.log('✅ Sucursales listas')

  // ── Consultorios ──────────────────────────────────────────────────────────
  const [consultorio1] = await Consultorio.findOrCreate({
    where: { nombre: 'Consultorio 1', sucursal_id: sucursalCentro.id },
    defaults: { activo: true },
  })
  const [consultorio2] = await Consultorio.findOrCreate({
    where: { nombre: 'Consultorio 2', sucursal_id: sucursalCentro.id },
    defaults: { activo: true },
  })
  await Consultorio.findOrCreate({
    where: { nombre: 'Consultorio A', sucursal_id: sucursalNorte.id },
    defaults: { activo: true },
  })
  console.log('✅ Consultorios listos')

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const [usuarioAdmin] = await Usuario.findOrCreate({
    where: { email: 'admin@clinica.com' },
    defaults: { nombre: 'Admin', apellido: 'Sistema', rol: 'admin', activo: true },
  })
  const [usuarioRecep] = await Usuario.findOrCreate({
    where: { email: 'recepcion@clinica.com' },
    defaults: { nombre: 'Laura', apellido: 'Gómez', rol: 'recepcionista', activo: true },
  })
  const [usuarioPro1] = await Usuario.findOrCreate({
    where: { email: 'dr.perez@clinica.com' },
    defaults: { nombre: 'Carlos', apellido: 'Pérez', rol: 'profesional', activo: true },
  })
  const [usuarioPro2] = await Usuario.findOrCreate({
    where: { email: 'dra.lopez@clinica.com' },
    defaults: { nombre: 'María', apellido: 'López', rol: 'profesional', activo: true },
  })
  console.log('✅ Usuarios listos')

  // ── Profesionales ─────────────────────────────────────────────────────────
  const [prof1] = await Profesional.findOrCreate({
    where: { email: 'dr.perez@clinica.com' },
    defaults: {
      nombre: 'Carlos',
      apellido: 'Pérez',
      dni: '20111222',
      telefono: '0351-5000001',
      matricula: 'MP-12345',
      usuario_id: usuarioPro1.id,
      activo: true,
    },
  })
  const [prof2] = await Profesional.findOrCreate({
    where: { email: 'dra.lopez@clinica.com' },
    defaults: {
      nombre: 'María',
      apellido: 'López',
      dni: '25333444',
      telefono: '0351-5000002',
      matricula: 'MP-67890',
      usuario_id: usuarioPro2.id,
      activo: true,
    },
  })
  console.log('✅ Profesionales listos')

  // ── ProfesionalEspecialidad ───────────────────────────────────────────────
  await ProfesionalEspecialidad.findOrCreate({
    where: { profesional_id: prof1.id, especialidad_id: ortodoncia.id },
  })
  await ProfesionalEspecialidad.findOrCreate({
    where: { profesional_id: prof1.id, especialidad_id: general.id },
  })
  await ProfesionalEspecialidad.findOrCreate({
    where: { profesional_id: prof2.id, especialidad_id: ortopedia.id },
  })
  console.log('✅ Especialidades de profesionales listas')

  // ── Horarios ──────────────────────────────────────────────────────────────
  // prof1: lunes a viernes 08:00-12:00
  for (const dia of [1, 2, 3, 4, 5]) {
    await ProfesionalHorario.findOrCreate({
      where: { profesional_id: prof1.id, dia_semana: dia, hora_inicio: '08:00' },
      defaults: { hora_fin: '12:00', consultorio_id: consultorio1.id, sucursal_id: sucursalCentro.id },
    })
  }
  // prof2: lunes, miércoles, viernes 14:00-18:00
  for (const dia of [1, 3, 5]) {
    await ProfesionalHorario.findOrCreate({
      where: { profesional_id: prof2.id, dia_semana: dia, hora_inicio: '14:00' },
      defaults: { hora_fin: '18:00', consultorio_id: consultorio2.id, sucursal_id: sucursalCentro.id },
    })
  }
  console.log('✅ Horarios listos')

  // ── Pacientes ─────────────────────────────────────────────────────────────
  const [pac1] = await Paciente.findOrCreate({
    where: { dni: '30555666' },
    defaults: {
      nombre: 'Juan',
      apellido: 'García',
      fecha_nacimiento: '1990-05-15',
      telefono: '0351-6000001',
      email: 'juan.garcia@mail.com',
      obra_social: 'OSDE',
      activo: true,
    },
  })
  const [pac2] = await Paciente.findOrCreate({
    where: { dni: '35777888' },
    defaults: {
      nombre: 'Ana',
      apellido: 'Martínez',
      fecha_nacimiento: '1995-08-22',
      telefono: '0351-6000002',
      email: 'ana.martinez@mail.com',
      activo: true,
    },
  })
  const [pac3] = await Paciente.findOrCreate({
    where: { dni: '28999000' },
    defaults: {
      nombre: 'Roberto',
      apellido: 'Fernández',
      fecha_nacimiento: '1985-12-01',
      telefono: '0351-6000003',
      obra_social: 'Swiss Medical',
      activo: true,
    },
  })
  console.log('✅ Pacientes listos')

  // ── Configuración ─────────────────────────────────────────────────────────
  const configs = [
    { clave: 'nombre_clinica', valor: 'Clínica Odontológica L&D', descripcion: 'Nombre de la clínica' },
    { clave: 'duracion_turno_minutos', valor: '30', descripcion: 'Duración predeterminada de un turno en minutos' },
    { clave: 'hora_apertura', valor: '08:00', descripcion: 'Hora de apertura general' },
    { clave: 'hora_cierre', valor: '20:00', descripcion: 'Hora de cierre general' },
    { clave: 'moneda', valor: 'ARS', descripcion: 'Moneda utilizada' },
  ]
  for (const cfg of configs) {
    await Configuracion.findOrCreate({ where: { clave: cfg.clave }, defaults: cfg })
  }
  console.log('✅ Configuración lista')

  // ── Días inhabilitados ────────────────────────────────────────────────────
  await DiaInhabilitado.findOrCreate({
    where: { fecha: '2026-07-09' },
    defaults: { motivo: 'Día de la Independencia', tipo: 'feriado', sucursal_id: null },
  })
  await DiaInhabilitado.findOrCreate({
    where: { fecha: '2026-08-17' },
    defaults: { motivo: 'Paso a la Inmortalidad del Gral. San Martín', tipo: 'feriado', sucursal_id: null },
  })
  console.log('✅ Días inhabilitados listos')

  // ── Tratamientos ──────────────────────────────────────────────────────────
  const [practica1] = await Practica.findOrCreate({ where: { codigo: '00001' } })
  const [practica4] = await Practica.findOrCreate({ where: { codigo: '00004' } })

  const [trat1] = await Tratamiento.findOrCreate({
    where: { paciente_id: pac1.id, fecha: '2026-06-01', practica_id: practica1.id },
    defaults: { profesional_id: prof1.id, estado: 'realizado', monto: 5000, observaciones: 'Primera sesión' },
  })
  const [trat2] = await Tratamiento.findOrCreate({
    where: { paciente_id: pac2.id, fecha: '2026-06-05', practica_id: practica4.id },
    defaults: { profesional_id: prof2.id, estado: 'pendiente', monto: 8000 },
  })
  console.log('✅ Tratamientos listos')

  // ── Cobros ────────────────────────────────────────────────────────────────
  await Cobro.findOrCreate({
    where: { paciente_id: pac1.id, tratamiento_id: trat1.id, fecha: '2026-06-01' },
    defaults: { monto: 5000, medio_pago: 'efectivo', descripcion: 'Pago sesión control' },
  })
  await Cobro.findOrCreate({
    where: { paciente_id: pac3.id, tratamiento_id: null, fecha: '2026-06-10' },
    defaults: { monto: 15000, medio_pago: 'transferencia', descripcion: 'Seña tratamiento' },
  })
  console.log('✅ Cobros listos')

  // ── Turnos ────────────────────────────────────────────────────────────────
  await Turno.findOrCreate({
    where: { paciente_id: pac1.id, profesional_id: prof1.id, fecha: '2026-06-15', hora_inicio: '09:00' },
    defaults: { consultorio_id: consultorio1.id, sucursal_id: sucursalCentro.id, hora_fin: '09:30', estado: 'confirmado' },
  })
  await Turno.findOrCreate({
    where: { paciente_id: pac2.id, profesional_id: prof2.id, fecha: '2026-06-16', hora_inicio: '14:00' },
    defaults: { consultorio_id: consultorio2.id, sucursal_id: sucursalCentro.id, hora_fin: '14:30', estado: 'pendiente' },
  })
  await Turno.findOrCreate({
    where: { paciente_id: pac3.id, profesional_id: prof1.id, fecha: '2026-06-17', hora_inicio: '10:00' },
    defaults: { consultorio_id: consultorio1.id, sucursal_id: sucursalCentro.id, hora_fin: '10:30', estado: 'pendiente' },
  })
  console.log('✅ Turnos listos')

  // ── Orden de llegada ──────────────────────────────────────────────────────
  const hoy = new Date().toISOString().slice(0, 10)
  const ordenExiste = await OrdenLlegada.findOne({ where: { paciente_id: pac1.id, fecha: hoy } })
  if (!ordenExiste) {
    await OrdenLlegada.create({
      paciente_id: pac1.id,
      profesional_id: prof1.id,
      fecha: hoy,
      hora_llegada: '08:05',
      numero_orden: 1,
      estado: 'esperando',
    })
  }
  console.log('✅ Orden de llegada lista')

  console.log('\n🎉 Seed completado exitosamente')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
