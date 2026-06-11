const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Consultorio = sequelize.define('consultorio', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sucursal_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'consultorios',
  timestamps: false,
})

module.exports = Consultorio
