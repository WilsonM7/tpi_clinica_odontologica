const { sequelize } = require('../config/database')

async function getHealth(req, res) {
  try {
    await sequelize.authenticate()
    res.json({
      status: 'ok',
      message: 'Backend funcionando correctamente',
      database: 'conectada',
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Backend activo pero sin conexión a la base de datos',
      database: 'desconectada',
      timestamp: new Date().toISOString(),
    })
  }
}

module.exports = { getHealth }
