import express from "express";
const router = express.Router();
import {
  crearCompra,
  obtenerCompra,
  obtenerCompras,
  actualizarEstadoCompra,
  eliminarCompra,
} from "../../controllers/buys/buysController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";


router.get("/",verificarAdmin, obtenerCompras);
router.post("/",verificarAdmin, crearCompra);
router.get("/:id",verificarAdmin, obtenerCompra);
router.put("/:id/estado",verificarAdmin, actualizarEstadoCompra); // Asegúrate de que el parámetro se llame `compraId`
router.delete("/:id",verificarAdmin, eliminarCompra);

export default router;
