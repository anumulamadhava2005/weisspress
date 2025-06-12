// server.js
const express = require('express');
const cors = require('cors');
const uploadRoute = require('./routes/upload');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // serve compressed files
app.use('/api', uploadRoute);

app.listen(PORT, () => {
  console.log(`WeissPress server running on http://localhost:${PORT}`);
});
