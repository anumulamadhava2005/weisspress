const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function compressFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const outputFile = path.join('uploads', `${Date.now()}-${file.originalname}`);

  return new Promise((resolve, reject) => {
    if (ext.match(/\.(mp4|mov|avi|mkv)$/)) {
      // Video compression
      ffmpeg(file.path)
        .outputOptions([
          '-vcodec libx264',
          '-crf 28',               // Compression level
          '-preset fast',
          '-movflags +faststart',
        ])
        .save(outputFile)
        .on('end', () => resolve(outputFile))
        .on('error', reject);
    } else if (ext.match(/\.(jpg|jpeg|png|webp)$/)) {
      // Image compression
      sharp(file.path)
        .resize({ width: 1280 })
        .toFormat('webp')
        .toFile(outputFile)
        .then(() => resolve(outputFile))
        .catch(reject);
    } else if (ext.match(/\.(mp3|aac|wav)$/)) {
      // Audio compression
      ffmpeg(file.path)
        .audioBitrate('96k')
        .save(outputFile)
        .on('end', () => resolve(outputFile))
        .on('error', reject);
    } else {
      // Generic compression fallback
      fs.copyFile(file.path, outputFile, (err) => {
        if (err) return reject(err);
        resolve(outputFile);
      });
    }
  });
}

module.exports = compressFile;
