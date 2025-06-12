const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const compressFile = require('../services/compressor');

const router = express.Router();

// Multer config (store temp input files)
const storage = multer.diskStorage({
  destination: 'temp/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

router.post('/upload', upload.array('media', 10), async (req, res) => {
  try {
    const compressedFiles = [];

    for (const file of req.files) {
      const compressedPath = await compressFile(file);
      compressedFiles.push({
        originalName: file.originalname,
        compressedUrl: `${req.protocol}://${req.get('host')}/uploads/${path.basename(compressedPath)}`,
      });
    }

    res.status(200).json({ success: true, files: compressedFiles });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Compression failed' });
  }
});

module.exports = router;
