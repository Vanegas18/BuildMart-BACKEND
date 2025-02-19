import express from "express";
import {
  getProductById,
  getProductos,
  newProduct,
  updateProduct,
  updateStateProduct,
} from "../../controllers/products/productController.js";
const router = express.Router();

router.post("/", newProduct);
router.get("/", getProductos);
router.get("/:productoId", getProductById);
router.put("/:productoId", updateProduct);
router.patch("/:productoId/estado", updateStateProduct);

export default router;
