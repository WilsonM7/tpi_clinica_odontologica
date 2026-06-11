const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProfesionalHorario = sequelize.define('profesional_horario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  profesional_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  dia_semana: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // 0=Domingo, 1=Lunes, ..., 6=Sábado
  },
  hora_inicio: {
    type: DataTypes.STRING(5),
    allowNull: false,
    // formato HH:MM
  },
  hora_fin: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  consultorio_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  sucursal_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'profesionales_horarios',
  timestamps: false,
})

module.exports = ProfesionalHorario
