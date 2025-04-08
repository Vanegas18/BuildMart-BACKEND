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

router.post("/", verificarAdmin, newPermissions);
router.get("/:nombreGrupo", verificarAdmin, getPermissionsByName);

router.get("/", verificarAdmin, getPermissions);
router.put("/:nombreGrupo", verificarAdmin, updatePermissions);
router.patch("/:nombreGrupo/estado", verificarAdmin, updateStatePermissions);

export default router;
