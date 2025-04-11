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
  },
});

// Configuración de Multer con Cloudinary
export const upload = multer({ storage: storage });

// Exportar cloudinary para usarlo en otros archivos
export { cloudinary };
