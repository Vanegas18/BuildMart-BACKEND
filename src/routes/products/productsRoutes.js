import express from "express";
import multer from "multer";
import {
  getProductById,
  getProductos,
  getProductosByEstado,
  newProduct,
  updateProduct,
  updateStateProduct,
} from "../../controllers/products/productController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

import { upload } from "../../utils/cloudinary.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log("🔍 Debugging productos:", {
    headers: req.headers,
    body: req.body,
    files: req.files,
    file: req.file,
  });
  next();
});

router.post(
  "/",
  verificarAdmin,
  (req, res, next) => {
    upload(req, res, function (err) {
      // Log detallado
      console.log("📝 Upload callback:", {
        error: err,
        body: req.body,
        file: req.file,
        headers: req.headers,
      });

      // Manejo de errores específicos
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            error: "Error en la subida del archivo",
            details: err.message,
            code: "MULTER_ERROR",
          });
        }

        // Error de Cloudinary
        if (err.http_code) {
          return res.status(err.http_code).json({
            error: "Error de procesamiento en Cloudinary",
            details: err.message,
            code: "CLOUDINARY_ERROR",
          });
        }

        // Otros errores
        return res.status(500).json({
          error: "Error al procesar el archivo",
          details: err.message,
          code: "UNKNOWN_ERROR",
        });
      }

      // Verificar archivo
      if (!req.file) {
        return res.status(400).json({
          error: "No se recibió ningún archivo",
          code: "NO_FILE",
        });
      }

      next();
    });
  },
  newProduct
);
router.get("/:productoId", getProductById);
router.get("/estado/:estado", getProductosByEstado);

// router.post("/", verificarAdmin, upload.single("image"), newProduct);

// router.put("/:productoId", upload.single("image"), updateProduct);

router.patch("/:productoId/estado", verificarAdmin, updateStateProduct);

export default router;
