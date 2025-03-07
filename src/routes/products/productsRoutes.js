import express from "express";
import {
  getProductById,
  getProductos,
  newProduct,
  updateProduct,
  updateStateProduct,
} from "../../controllers/products/productController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

router.get("/", getProductos);
router.get("/:productoId", getProductById);

router.post("/", verificarAdmin, newProduct);
router.put("/:productoId", verificarAdmin, updateProduct);
router.patch("/:productoId/estado", verificarAdmin, updateStateProduct);

export default router;
