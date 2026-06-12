const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Usuario = sequelize.define('usuario', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'recepcionista',
    // valores: admin, recepcionista, profesional
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
})

module.exports = Usuario
