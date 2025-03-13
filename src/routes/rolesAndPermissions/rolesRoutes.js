import express from "express";
import {
  getRolByName,
  getRoles,
  newRol,
  updateRol,
  updateStateRol,
} from "../../controllers/rolesAndPermissions/rolesController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

router.get("/", getRoles);
router.get("/:nombre", verificarAdmin, getRolByName);

router.post("/", newRol);
router.put("/:nombre", verificarAdmin, updateRol);
router.patch("/:nombre/estado", verificarAdmin, updateStateRol);

export default router;
