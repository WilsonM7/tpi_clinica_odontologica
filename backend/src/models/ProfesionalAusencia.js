const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProfesionalAusencia = sequelize.define('profesional_ausencia', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  profesional_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'profesionales_ausencias',
  timestamps: false,
})

module.exports = ProfesionalAusencia
