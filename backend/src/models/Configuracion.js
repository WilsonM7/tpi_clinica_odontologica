const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Configuracion = sequelize.define('configuracion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clave: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'configuracion',
  timestamps: false,
})

module.exports = Configuracion
