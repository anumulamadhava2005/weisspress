const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

async function compressFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext);
  const timestamp = Date.now();
  const BASE_URL = "https://e5d6-144-48-227-91.ngrok-free.app";

  const result = { originalName: file.originalname };

  return new Promise((resolve, reject) => {
    // Handle VIDEO files
    if (ext.match(/\.(mp4|mov|avi|mkv)$/)) {
      const outputVideoPath = path.join("uploads/videos", `${timestamp}-${baseName}.mp4`);
      const thumbnailPath = path.join("uploads/thumbnails", `${timestamp}-${baseName}.jpg`);

      ffmpeg(file.path)
        .outputOptions([
          "-vcodec libx264",
          "-crf 28",
          "-preset fast",
          "-movflags +faststart",
        ])
        .save(outputVideoPath)
        .on("end", () => {
          // Generate thumbnail
          ffmpeg(file.path)
            .screenshots({
              timestamps: ["10%"],
              filename: path.basename(thumbnailPath),
              folder: "uploads/thumbnails",
              size: "640x?"
            })
            .on("end", () => {
              result.compressedUrl = `${BASE_URL}/uploads/videos/${path.basename(outputVideoPath)}`;
              result.thumbnailUrl = `${BASE_URL}/uploads/thumbnails/${path.basename(thumbnailPath)}`;
              resolve(result);
            })
            .on("error", reject);
        })
        .on("error", reject);
    }

    // Handle IMAGE files
    else if (ext.match(/\.(jpg|jpeg|png|webp)$/)) {
      const sizes = {
        low: 320,
        medium: 720,
        high: 1280
      };
      result.variants = [];

      const promises = Object.entries(sizes).map(async ([label, width]) => {
        const outputImage = path.join("uploads/images", `${timestamp}-${baseName}-${label}.webp`);
        await sharp(file.path)
          .resize({ width })
          .webp({ quality: label === 'low' ? 40 : label === 'medium' ? 70 : 90 })
          .toFile(outputImage);

        result.variants.push({
          quality: label,
          url: `${BASE_URL}/uploads/images/${path.basename(outputImage)}`
        });
      });

      Promise.all(promises)
        .then(() => resolve(result))
        .catch(reject);
    }

    // Handle OTHER files
    else {
      const outputPath = path.join("uploads/files", `${timestamp}-${file.originalname}`);
      fs.copyFile(file.path, outputPath, (err) => {
        if (err) return reject(err);
        result.compressedUrl = `/uploads/files/${path.basename(outputPath)}`;
        resolve(result);
      });
    }
  });
}

module.exports = compressFile;