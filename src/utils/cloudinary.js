// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración del almacenamiento
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "productos", // Carpeta donde se guardarán las imágenes
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // Formatos permitidos
    transformation: [{ width: 1000, height: 1000, crop: "limit" }], // Transformaciones opcionales
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
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error("Solo se permiten imágenes jpg, jpeg, png y webp"));
    }
    cb(null, true);
  },
});

// Exportar cloudinary para usarlo en otros archivos
export { upload, cloudinary };
