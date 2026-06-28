const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const OrdenLlegada = sequelize.define('orden_llegada', {
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
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora_llegada: {
    type: DataTypes.STRING(5),
    allowNull: false,
    // formato HH:MM
  },
  numero_orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'esperando',
    // valores: esperando, atendido, cancelado
  },
}, {
  tableName: 'orden_llegada',
  timestamps: true,
})

module.exports = OrdenLlegada
