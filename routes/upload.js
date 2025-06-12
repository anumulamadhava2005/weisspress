const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const compressFile = require("../services/compressor");

// Multer config: store uploaded files temporarily in temp/
const storage = multer.diskStorage({
  destination: "temp/",
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${timestamp}-${safeName}`);
  },
});
const upload = multer({ storage });

// POST /api/upload
router.post("/upload", upload.array("media"), async (req, res) => {
  try {
    const files = req.files;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const results = [];

    for (const file of files) {
      // Compress and move to uploads/
      const result = await compressFile(file);
      results.push(result);

      // Delete the temporary uploaded file in temp/
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Error deleting temp file: ${file.path}`, err);
        else console.log(`🗑️ Deleted temp file: ${file.path}`);
      });
    }

    res.json({ success: true, files: results });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
});

module.exports = router;
