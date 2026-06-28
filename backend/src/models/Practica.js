const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Practica = sequelize.define('practica', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  codigo: {
    type: DataTypes.STRING(5),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  valor: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
  },
  especialidad_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  cobra_descartable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  costo_mecanico: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  multa: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  tipo_multa: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'practicas',
  timestamps: false,
})

module.exports = Practica
