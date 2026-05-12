const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const os = require('os')
const { importarRetiro } = require('../controllers/importRetiroController')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `retiro_${Date.now()}${path.extname(file.originalname)}`)
})

const upload = multer({ storage })

router.post('/retiro', upload.single('archivo'), importarRetiro)

module.exports = router