const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Profesional = sequelize.define('profesional', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  matricula: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'profesionales',
  timestamps: true,
})

module.exports = Profesional
