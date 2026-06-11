require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { sequelize, Especialidad, Practica } = require('../models/index')

async function seed() {
  await sequelize.sync()

  const [ortodoncia] = await Especialidad.findOrCreate({
    where: { nombre: 'Ortodoncia' },
    defaults: { activa: true },
  })
  const [ortopedia] = await Especialidad.findOrCreate({
    where: { nombre: 'Ortopedia' },
    defaults: { activa: true },
  })
  await Especialidad.findOrCreate({
    where: { nombre: 'General' },
    defaults: { activa: true },
  })
  console.log('✅ Especialidades listas')

  await Practica.findOrCreate({
    where: { codigo: '00001' },
    defaults: {
      nombre: 'Control Ortodoncia',
      valor: 5000,
      especialidad_id: ortodoncia.id,
      cobra_descartable: true,
      activa: true,
    },
  })
  await Practica.findOrCreate({
    where: { codigo: '00002' },
    defaults: {
      nombre: 'Instalación Metálicos',
      valor: 50000,
      especialidad_id: ortodoncia.id,
      cobra_descartable: false,
      activa: true,
    },
  })
  await Practica.findOrCreate({
    where: { codigo: '00003' },
    defaults: {
      nombre: 'Instalación Porcelana',
      valor: 80000,
      especialidad_id: ortopedia.id,
      cobra_descartable: false,
      activa: true,
    },
  })
  console.log('✅ Prácticas de prueba listas')
  console.log('🎉 Seed completado')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
