const { sequelize } = require('../config/database')

const Especialidad = require('./Especialidad')
const Practica = require('./Practica')
const Sucursal = require('./Sucursal')
const Consultorio = require('./Consultorio')
const Paciente = require('./Paciente')
const Usuario = require('./Usuario')
const Profesional = require('./Profesional')
const ProfesionalEspecialidad = require('./ProfesionalEspecialidad')
const ProfesionalPorcentajeEspecialidad = require('./ProfesionalPorcentajeEspecialidad')
const ProfesionalHorario = require('./ProfesionalHorario')
const ProfesionalAusencia = require('./ProfesionalAusencia')
const Tratamiento = require('./Tratamiento')
const Turno = require('./Turno')
const OrdenLlegada = require('./OrdenLlegada')
const Configuracion = require('./Configuracion')
const DiaInhabilitado = require('./DiaInhabilitado')

// Especialidad <-> Practica
Especialidad.hasMany(Practica, { foreignKey: 'especialidad_id', as: 'practicas' })
Practica.belongsTo(Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' })

// Sucursal <-> Consultorio
Sucursal.hasMany(Consultorio, { foreignKey: 'sucursal_id', as: 'consultorios' })
Consultorio.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' })

// Sucursal <-> DiaInhabilitado
Sucursal.hasMany(DiaInhabilitado, { foreignKey: 'sucursal_id', as: 'dias_inhabilitados' })
DiaInhabilitado.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' })

// Usuario <-> Sucursal
Usuario.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' })
Sucursal.hasMany(Usuario, { foreignKey: 'sucursal_id', as: 'usuarios' })

// Usuario <-> Profesional
Usuario.hasOne(Profesional, { foreignKey: 'usuario_id', as: 'profesional' })
Profesional.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' })

// Profesional <-> Especialidad (tabla pivot)
Profesional.hasMany(ProfesionalEspecialidad, { foreignKey: 'profesional_id', as: 'especialidades' })
ProfesionalEspecialidad.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' })
ProfesionalEspecialidad.belongsTo(Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' })
Especialidad.hasMany(ProfesionalEspecialidad, { foreignKey: 'especialidad_id', as: 'profesionales_especialidad' })

// Profesional <-> PorcentajeEspecialidad
Profesional.hasMany(ProfesionalPorcentajeEspecialidad, { foreignKey: 'profesional_id', as: 'porcentajes' })
ProfesionalPorcentajeEspecialidad.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' })
ProfesionalPorcentajeEspecialidad.belongsTo(Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' })

// Profesional <-> Horario
Profesional.hasMany(ProfesionalHorario, { foreignKey: 'profesional_id', as: 'horarios' })
ProfesionalHorario.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' })
ProfesionalHorario.belongsTo(Consultorio, { foreignKey: 'consultorio_id', as: 'consultorio' })
ProfesionalHorario.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' })

// Profesional <-> Ausencia
Profesional.hasMany(ProfesionalAusencia, { foreignKey: 'profesional_id', as: 'ausencias' })
ProfesionalAusencia.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' })

// Paciente <-> Tratamiento
Paciente.hasMany(Tratamiento, { foreignKey: 'paciente_id', as: 'tratamientos' })
Tratamiento.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' })

// Profesional <-> Tratamiento
Profesional.hasMany(Tratamiento, { foreignKey: 'profesional_id', as: 'tratamientos' })
Tratamiento.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' })

// Practica <-> Tratamiento
Practica.hasMany(Tratamiento, { foreignKey: 'practica_id', as: 'tratamientos' })
Tratamiento.belongsTo(Practica, { foreignKey: 'practica_id', as: 'practica' })


// Paciente <-> Turno
Paciente.hasMany(Turno, { foreignKey: 'paciente_id', as: 'turnos' })
Turno.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' })

// Profesional <-> Turno
Profesional.hasMany(Turno, { foreignKey: 'profesional_id', as: 'turnos' })
Turno.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' })

// Consultorio <-> Turno
Consultorio.hasMany(Turno, { foreignKey: 'consultorio_id', as: 'turnos' })
Turno.belongsTo(Consultorio, { foreignKey: 'consultorio_id', as: 'consultorio' })

// Sucursal <-> Turno
Sucursal.hasMany(Turno, { foreignKey: 'sucursal_id', as: 'turnos' })
Turno.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' })

// Practica <-> Turno
Practica.hasMany(Turno, { foreignKey: 'practica_id', as: 'turnos_agenda' })
Turno.belongsTo(Practica, { foreignKey: 'practica_id', as: 'practica' })

// Paciente <-> OrdenLlegada
Paciente.hasMany(OrdenLlegada, { foreignKey: 'paciente_id', as: 'ordenes_llegada' })
OrdenLlegada.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' })

// Profesional <-> OrdenLlegada
Profesional.hasMany(OrdenLlegada, { foreignKey: 'profesional_id', as: 'ordenes_llegada' })
OrdenLlegada.belongsTo(Profesional, { foreignKey: 'profesional_id', as: 'profesional' })

module.exports = {
  sequelize,
  Especialidad,
  Practica,
  Sucursal,
  Consultorio,
  Paciente,
  Usuario,
  Profesional,
  ProfesionalEspecialidad,
  ProfesionalPorcentajeEspecialidad,
  ProfesionalHorario,
  ProfesionalAusencia,
  Tratamiento,
  Turno,
  OrdenLlegada,
  Configuracion,
  DiaInhabilitado,
}
