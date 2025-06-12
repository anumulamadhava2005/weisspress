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
app.use('/media/videos', express.static(path.join(__dirname, 'uploads/videos')));
app.use('/media/thumbnails', express.static(path.join(__dirname, 'uploads/thumbnails')));
app.use('/media/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/media/files', express.static(path.join(__dirname, 'uploads/files')));
app.use('/api', uploadRoute);

app.listen(PORT, () => {
  console.log(`WeissPress server running on http://localhost:${PORT}`);
});
