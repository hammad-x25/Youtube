import multer from "multer";
import fs from "fs";
import path from "path";

const tempDirectory = path.resolve(process.env.UPLOAD_TEMP_DIR || "public/temp");
fs.mkdirSync(tempDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDirectory)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

export const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES) || 1024 * 1024 * 1024,
    files: 2,
  },
});
