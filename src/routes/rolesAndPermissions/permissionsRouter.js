import express from "express";
import {
  getPermissions,
  getPermissionsByName,
  newPermissions,
  updatePermissions,
  updateStatePermissions,
} from "../../controllers/rolesAndPermissions/permissionsController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

router.post("/", newPermissions);
router.get("/:nombreGrupo", getPermissionsByName);

router.get("/", getPermissions);
router.put("/:nombreGrupo", updatePermissions);
router.patch("/:nombreGrupo/estado", updateStatePermissions);

export default router;
