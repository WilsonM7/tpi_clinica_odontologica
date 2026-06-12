const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProfesionalPorcentajeEspecialidad = sequelize.define('profesional_porcentaje_especialidad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  profesional_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  especialidad_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  porcentaje: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'profesionales_porcentajes_especialidades',
  timestamps: false,
})

module.exports = ProfesionalPorcentajeEspecialidad
