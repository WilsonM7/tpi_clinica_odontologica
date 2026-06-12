const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Tratamiento = sequelize.define('tratamiento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  paciente_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  profesional_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  practica_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
    // valores: pendiente, realizado, cancelado
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'tratamientos',
  timestamps: true,
})

module.exports = Tratamiento
