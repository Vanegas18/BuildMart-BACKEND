import express from "express";
const router = express.Router();
import {
  crearCompra,
  obtenerCompra,
  obtenerCompras,
  actualizarCompra,
  eliminarCompra,
  cambiarEstadoCompra,
} from "../../controllers/buys/buysController.js";

router.get("/", obtenerCompras);
router.post("/", crearCompra);
router.get("/:compraId", obtenerCompra);
router.put("/:compraId", actualizarCompra);
router.delete("/:id", eliminarCompra);
router.patch("/:compraId/estado", cambiarEstadoCompra);

export default router;
