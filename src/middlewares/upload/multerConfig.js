import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear el directorio de destino si no existe
const uploadDir = path.join(__dirname, "../../uploads/productos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Directorio de destino
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9); // Sufijo único para evitar colisiones de nombres
    const ext = path.extname(file.originalname); // Obtener la extensión del archivo original
    cb(null, uniqueSuffix + ext); // Guardar el archivo con un nombre único
  },
});

// Filtro para permitir solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Aceptar el archivo
  } else {
    cb(new Error("Solo se permiten imágenes (jpeg, png, gif, webp)"), false); // Rechazar el archivo
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limitar el tamaño del archivo a 5 MB
  },
});

// Middleware para procesar la imagen cargada
export const processUploadedImage = (req, res, next) => {
  if (req.file) {
    // Si se ha cargado un archivo, agregar la ruta al objeto de solicitud
    req.body.img = `/uploads/productos/${req.file.filename}`; // Guardar la ruta de la imagen en el cuerpo de la solicitud
    req.body.imgType = "file";
  }
  next();
};

export default upload;
