import express from "express";
import {
  getClients,
  createClient,
  updateClient,
  addDireccion,
  updateDireccion,
  deleteDireccion,
  addMetodoPago,
  updateMetodoPago,
  deleteMetodoPago,
} from "../../controllers/customers/clientController.js";

const router = express.Router();

// Rutas básicas de cliente
router.get("/", getClients);
router.get("/:id", getClients);
router.post("/", createClient);
router.put("/:id", updateClient);

// Rutas para gestionar direcciones
router.post("/:id/direcciones", addDireccion);
router.put("/:id/direcciones/:direccionId", updateDireccion);
router.delete("/:id/direcciones/:direccionId", deleteDireccion);

// Rutas para gestionar métodos de pago
router.post("/:id/metodos-pago", addMetodoPago);
router.put("/:id/metodos-pago/:metodoPagoId", updateMetodoPago);
router.delete("/:id/metodos-pago/:metodoPagoId", deleteMetodoPago);

export default router;
