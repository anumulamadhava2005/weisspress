const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Update this with your deployed base URL when not using localhost
const BASE_URL = "https://weisspress.onrender.com";

// Helper to ensure output directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

async function compressFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext);
  const timestamp = Date.now();

  const result = { originalName: file.originalname };

  return new Promise((resolve, reject) => {
    // Handle VIDEO files
    if (ext.match(/\.(mp4|mov|avi|mkv)$/)) {
      const videoDir = path.join("uploads/videos");
      const thumbDir = path.join("uploads/thumbnails");
      ensureDir(videoDir);
      ensureDir(thumbDir);

      const outputVideoPath = path.join(videoDir, `${timestamp}-${baseName}.mp4`);
      const thumbnailPath = path.join(thumbDir, `${timestamp}-${baseName}.jpg`);

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
              folder: thumbDir,
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

    // Handle IMAGE files
    else if (ext.match(/\.(jpg|jpeg|png|webp)$/)) {
      const imageDir = path.join("uploads/images");
      ensureDir(imageDir);

      const sizes = {
        low: 320,
        medium: 720,
        high: 1280
      };
      result.variants = [];

      const promises = Object.entries(sizes).map(async ([label, width]) => {
        const outputImage = path.join(imageDir, `${timestamp}-${baseName}-${label}.webp`);
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

    // Handle OTHER files
    else {
      const filesDir = path.join("uploads/files");
      ensureDir(filesDir);

      const outputPath = path.join(filesDir, `${timestamp}-${file.originalname}`);
      fs.copyFile(file.path, outputPath, (err) => {
        if (err) return reject(err);
        result.compressedUrl = `${BASE_URL}/media/files/${path.basename(outputPath)}`;
        resolve(result);
      });
    }
  });
}

module.exports = compressFile;
