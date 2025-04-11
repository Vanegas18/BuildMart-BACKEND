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
    format: "jpg", // Forzar formato jpg
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"], // Añadir avif a los formatos permitidos
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: "limit",
        format: "jpg", // Convertir todo a jpg
      },
    ],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return `producto-${uniqueSuffix}`;
    },
  },
});

const fileFilter = (req, file, cb) => {
  // Log detallado del archivo
  console.log("🔍 Verificando archivo:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // Lista de tipos MIME permitidos
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de archivo no permitido. Se permite: ${allowedMimes.join(", ")}`
      )
    );
  }
};

// Configurar límites y filtros
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter,
}).single("image");

// Exportar cloudinary para usarlo en otros archivos
export { upload, cloudinary };
