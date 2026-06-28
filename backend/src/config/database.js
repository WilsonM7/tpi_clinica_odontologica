const { Sequelize } = require('sequelize')
const path = require('path')

const dbStorage = process.env.DB_STORAGE || './database.sqlite'

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(dbStorage),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
})

async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('✅ Conexión a SQLite establecida correctamente.')
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error)
    throw error
  }
}

module.exports = { sequelize, testConnection }
