const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const os = require('os')
const { importarAband } = require('../controllers/importAbandController')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `aband_${Date.now()}${path.extname(file.originalname)}`)
})

const upload = multer({ storage })

router.post('/aband', upload.single('archivo'), importarAband)

module.exports = router