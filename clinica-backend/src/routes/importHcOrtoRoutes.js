const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const os = require('os')
const { importarHcOrto } = require('../controllers/importHcOrtoController')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `hcorto_${Date.now()}${path.extname(file.originalname)}`)
})

const upload = multer({ storage })

router.post('/hc-orto', upload.single('archivo'), importarHcOrto)

module.exports = router