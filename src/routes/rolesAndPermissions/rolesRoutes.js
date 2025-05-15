import express from "express";
import {
  getRolById,
  getRolByName,
  getRoles,
  newRol,
  updateRol,
  updateStateRol,
} from "../../controllers/rolesAndPermissions/rolesController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

router.get("/", getRoles);
router.get("/:nombre", getRolByName);
router.get("/:id", getRolById);

router.post("/", verificarAdmin, newRol);
router.put("/:nombre", verificarAdmin, updateRol);
router.patch("/:nombre/estado", verificarAdmin, updateStateRol);

export default router;
