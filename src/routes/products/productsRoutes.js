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

router.get("/", getProductos);
router.get("/:productoId", getProductById);
router.get("/estado/:estado", getProductosByEstado);

router.post("/", upload.single("image"), verificarAdmin, newProduct);

router.put("/:productoId", upload.single("image"), updateProduct);

router.patch("/:productoId/estado", verificarAdmin, updateStateProduct);

export default router;
