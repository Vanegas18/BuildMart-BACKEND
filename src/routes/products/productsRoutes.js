import express from "express";
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
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          error: "Error al subir el archivo",
          details: err.message,
        });
      } else if (err) {
        return res.status(500).json({
          error: "Error al procesar el archivo",
          details: err.message,
        });
      }
      // Si todo está bien, continuar
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
