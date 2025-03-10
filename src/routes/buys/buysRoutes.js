import express from "express";
const router = express.Router();
import {
  crearCompra,
  obtenerCompra,
  obtenerCompras,
  actualizarEstadoCompra,
  eliminarCompra,
} from "../../controllers/buys/buysController.js";

router.get("/", obtenerCompras);
router.post("/", crearCompra);
router.get("/:id", obtenerCompra);
router.put("/:id/estado", actualizarEstadoCompra); // Asegúrate de que el parámetro se llame `compraId`
router.delete("/:id", eliminarCompra);

export default router;
