import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + "-" + Date.now() + ext;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png"];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    req.uploadError = "Only JPEG/PNG images allowed.";
    cb(null, false);
  }
};

export const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadWithValidation = (req, res, next) => {
  const upload = multerUpload.any();

  upload(req, res, function (err) {
    if (err) {
      req.uploadError = err.message;
      console.error("Multer Error:", err.message);
      return next();
    }

    const files = req.files || [];
    const grouped = files.reduce((acc, file) => {
      acc[file.fieldname] = acc[file.fieldname] || [];
      acc[file.fieldname].push(file);
      return acc;
    }, {});

    if (req.method === "POST") {
      if (grouped.serviceImg && grouped.serviceImg.length > 1) {
        req.uploadError = "Only one serviceImg allowed.";
        return next();
      }
      if (grouped.category_image && grouped.category_image.length > 1) {
        req.uploadError = "Only one category_image allowed.";
        return next();
      }
      if (grouped.profileImage && grouped.profileImage.length > 1) {
        req.uploadError = "Only one profileImage allowed.";
        return next();
      }

      if (grouped.photos && grouped.photos.length > 5) {
        req.uploadError = "Maximum 5 photos allowed.";
        return next();
      }

      for (const field in grouped) {
        if (field.startsWith("serviceImg_") && grouped[field].length > 1) {
          req.uploadError = `Only 1 file allowed for ${field}`;
          return next();
        }
      }
    }

    next();
  });
};
