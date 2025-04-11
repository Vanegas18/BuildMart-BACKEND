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

router.post(
  "/",
  verificarAdmin,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          error: "Error en la subida del archivo",
          details: err.message,
        });
      }
      next();
    });
  },
  newProduct
);

router.get("/", getProductos);
router.get("/:productoId", getProductById);
router.get("/estado/:estado", getProductosByEstado);
router.patch("/:productoId/estado", verificarAdmin, updateStateProduct);

export default router;
