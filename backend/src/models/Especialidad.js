const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Especialidad = sequelize.define('especialidad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'especialidades',
  timestamps: false,
})

module.exports = Especialidad
