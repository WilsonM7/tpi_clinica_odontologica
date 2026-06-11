const { sequelize } = require('../config/database')
const Especialidad = require('./Especialidad')
const Practica = require('./Practica')

Especialidad.hasMany(Practica, { foreignKey: 'especialidad_id', as: 'practicas' })
Practica.belongsTo(Especialidad, { foreignKey: 'especialidad_id', as: 'especialidad' })

module.exports = { sequelize, Especialidad, Practica }
