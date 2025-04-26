import express from "express";
import {
  getClients,
  createClient,
  updateClient,
} from "../../controllers/customers/clientController.js";

const router = express.Router();

// Rutas básicas de cliente
router.get("/", getClients);
router.get("/:id", getClients);
router.post("/", createClient);
router.put("/:id", updateClient);

export default router;
