// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dd0h4fe3t",
  api_key: process.env.CLOUDINARY_API_KEY || "764712955812817",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "Yn8Y3_-e2slbf5EdI8hSq6y_E-4",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "productos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return `producto-${uniqueSuffix}`;
    },
  },
});

// Configurar límites y filtros
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    console.log("📸 Procesando archivo:", file);
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error("Solo se permiten imágenes jpg, jpeg, png y webp"));
    }
    cb(null, true);
  },
});

// Exportar cloudinary para usarlo en otros archivos
export { upload, cloudinary };
