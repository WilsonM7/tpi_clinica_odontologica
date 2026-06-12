const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProfesionalEspecialidad = sequelize.define('profesional_especialidad', {
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
}, {
  tableName: 'profesionales_especialidades',
  timestamps: false,
})

module.exports = ProfesionalEspecialidad
