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
router.get("/:nombre", verificarAdmin, getPermissionsByName);

router.get("/", getPermissions);
router.put("/:nombre", verificarAdmin, updatePermissions);
router.patch("/:nombre/estado", verificarAdmin, updateStatePermissions);

export default router;
