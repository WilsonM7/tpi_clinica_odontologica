const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Turno = sequelize.define('turno', {
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
    allowNull: false,
  },
  consultorio_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  sucursal_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora_inicio: {
    type: DataTypes.STRING(5),
    allowNull: false,
    // formato HH:MM
  },
  hora_fin: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
    // valores: pendiente, confirmado, cancelado, realizado
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'turnos',
  timestamps: true,
})

module.exports = Turno
