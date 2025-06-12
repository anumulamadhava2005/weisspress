const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const BASE_URL = "https://weisspress.onrender.com"; // Change this to your deployed URL

async function compressFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
  const timestamp = Date.now();

  const result = { originalName: file.originalname };

  return new Promise((resolve, reject) => {
    // VIDEO FILES
    if (/\.(mp4|mov|avi|mkv)$/.test(ext)) {
      const outputVideoPath = path.join("uploads/videos", `${timestamp}-${baseName}.mp4`);
      const thumbnailPath = path.join("uploads/thumbnails", `${timestamp}-${baseName}.jpg`);

      ffmpeg(file.path)
        .outputOptions([
          "-vcodec libx264",
          "-crf 28",
          "-preset fast",
          "-movflags +faststart"
        ])
        .save(outputVideoPath)
        .on("end", () => {
          // Thumbnail generation
          ffmpeg(file.path)
            .screenshots({
              timestamps: ["10%"],
              filename: path.basename(thumbnailPath),
              folder: "uploads/thumbnails",
              size: "640x?"
            })
            .on("end", () => {
              result.compressedUrl = `${BASE_URL}/media/videos/${path.basename(outputVideoPath)}`;
              result.thumbnailUrl = `${BASE_URL}/media/thumbnails/${path.basename(thumbnailPath)}`;
              resolve(result);
            })
            .on("error", reject);
        })
        .on("error", reject);
    }

    // IMAGE FILES
    else if (/\.(jpg|jpeg|png|webp)$/.test(ext)) {
      const sizes = { low: 320, medium: 720, high: 1280 };
      result.variants = [];

      const promises = Object.entries(sizes).map(async ([label, width]) => {
        const outputImage = path.join("uploads/images", `${timestamp}-${baseName}-${label}.webp`);
        await sharp(file.path)
          .resize({ width })
          .webp({ quality: label === 'low' ? 40 : label === 'medium' ? 70 : 90 })
          .toFile(outputImage);

        result.variants.push({
          quality: label,
          url: `${BASE_URL}/media/images/${path.basename(outputImage)}`
        });
      });

      Promise.all(promises)
        .then(() => resolve(result))
        .catch(reject);
    }

    // OTHER FILES
    else {
      const outputPath = path.join("uploads/files", `${timestamp}-${file.originalname}`);
      fs.copyFile(file.path, outputPath, (err) => {
        if (err) return reject(err);
        result.compressedUrl = `${BASE_URL}/media/files/${path.basename(outputPath)}`;
        resolve(result);
      });
    }
  });
}

module.exports = compressFile;
