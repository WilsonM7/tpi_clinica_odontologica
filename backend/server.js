require('dotenv').config()
const app = require('./src/app')
const { testConnection } = require('./src/config/database')

const PORT = process.env.PORT || 3001

async function start() {
  await testConnection()
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
    console.log(`   → Endpoint de prueba: http://localhost:${PORT}/api/health`)
  })
}

start()
