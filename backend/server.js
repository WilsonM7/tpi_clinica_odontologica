require('dotenv').config()
const app = require('./src/app')
const { testConnection } = require('./src/config/database')
const { sequelize } = require('./src/models/index')

const PORT = process.env.PORT || 3001

async function start() {
  await testConnection()
  await sequelize.sync()
  console.log('📋 Tablas sincronizadas con SQLite')
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
    console.log(`   → Endpoint de prueba: http://localhost:${PORT}/api/health`)
  })
}

start()
