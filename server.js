// server.js
const express = require('express');
const cors = require('cors');
const path = require("path");
const uploadRoute = require('./routes/upload');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"),{
  setHeaders: (res, filePath) => {
    // Optional: force inline content for files
    res.setHeader("Content-Disposition", "inline");
  }
}));
app.use("/thumbnails", express.static(path.join(__dirname, "thumbnails")));
app.use('/api', uploadRoute);

app.listen(PORT, () => {
  console.log(`WeissPress server running on http://localhost:${PORT}`);
});
