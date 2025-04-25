import express from "express";
import {
  createSale,
  getSales,
  updateSaleStatus,
} from "../../controllers/sales/saleController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

// Ruta para obtener las ventas
router.get("/:id?", getSales);

// Ruta para crear una nueva venta
router.post("/", verificarAdmin, createSale);

router.put("/:id", verificarAdmin, updateSaleStatus);

export default router;
