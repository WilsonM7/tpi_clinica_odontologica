const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const DiaInhabilitado = sequelize.define('dia_inhabilitado', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'feriado',
    // valores: feriado, mantenimiento, otro
  },
  sucursal_id: {
    type: DataTypes.UUID,
    allowNull: true,
    // null = aplica a todas las sucursales
  },
}, {
  tableName: 'dias_inhabilitados',
  timestamps: false,
})

module.exports = DiaInhabilitado
