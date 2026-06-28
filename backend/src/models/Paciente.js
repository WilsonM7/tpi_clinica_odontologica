const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Paciente = sequelize.define('paciente', {
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
    unique: true,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
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
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  obra_social: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numero_afiliado: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  como_conocio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fecha_ingreso: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'pacientes',
  timestamps: true,
})

module.exports = Paciente
