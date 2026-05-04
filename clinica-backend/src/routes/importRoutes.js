const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const os = require('os')
const { importarPacientes } = require('../controllers/importController')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `import_${Date.now()}${path.extname(file.originalname)}`)
})

const upload = multer({ storage })

router.post('/pacientes', upload.single('archivo'), importarPacientes)

module.exports = router