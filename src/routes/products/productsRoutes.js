import express from "express";
import {
  getProductById,
  getProductos,
  newProduct,
  updateProduct,
  updateStateProduct,
} from "../../controllers/products/productController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

import upload, {
  processUploadedImage,
} from "../../middlewares/upload/multerConfig.js";

const router = express.Router();

router.get("/", getProductos);
router.get("/:productoId", getProductById);

router.post("/", verificarAdmin, newProduct);

// Ruta nueva para crear producto con imagen subida
router.post(
  "/upload",
  verificarAdmin,
  upload.single("image"),
  processUploadedImage,
  newProduct
);

router.put("/:productoId", verificarAdmin, updateProduct);

// Ruta nueva para actualizar producto con imagen subida
router.put(
  "/upload/:productoId",
  verificarAdmin,
  upload.single("image"),
  processUploadedImage,
  updateProduct
);
router.patch("/:productoId/estado", verificarAdmin, updateStateProduct);

export default router;
