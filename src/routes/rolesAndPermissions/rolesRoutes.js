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
router.get("/byId/:id", getRolById);

router.post("/", newRol);
router.put("/:nombre", updateRol);
router.patch("/:nombre/estado", updateStateRol);

export default router;
