import express from "express";
import {
  createClient,
  getClients,
  updateClient,
} from "../../controllers/customers/clientController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

// Ruta para obtener clientes (con o sin ID)
router.get("/:id?", verificarAdmin, getClients);

// Ruta para crear un cliente
router.post("/", createClient);

// Ruta para actualizar un cliente
router.put("/:id", verificarAdmin, updateClient);

export default router;
