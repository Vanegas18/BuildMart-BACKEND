import express from "express";
import { verificarAdmin } from "../middlewares/auth/configAuth.js";
import {
  obtenerNotificacionesUsuario,
  marcarNotificacionesLeidas,
  obtenerContadorNotificaciones,
} from "../controllers/notificacionesController.js";

const router = express.Router();

router.use(verificarAdmin); // Middleware para verificar si el usuario es administrador

router.get("/", obtenerNotificacionesUsuario); // Obtener notificaciones del usuario autenticado
router.post("/marcar-leidas", marcarNotificacionesLeidas); // Marcar notificaciones como leídas (opcional)
router.get("/contador", obtenerContadorNotificaciones); // Obtener contador de notificaciones nuevas

export default router;
