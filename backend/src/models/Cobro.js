const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Cobro = sequelize.define('cobro', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  paciente_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  tratamiento_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  medio_pago: {
    type: DataTypes.STRING,
    allowNull: true,
    // efectivo, tarjeta, transferencia, cheque
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'cobros',
  timestamps: true,
})

module.exports = Cobro
