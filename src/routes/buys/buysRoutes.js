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
router.get("/:id", obtenerCompra); 
router.put("/:id", actualizarCompra);
router.delete("/:id", eliminarCompra);
router.patch("/:id/estado", cambiarEstadoCompra);

export default router;
