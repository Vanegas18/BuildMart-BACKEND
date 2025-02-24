import express from "express";
import {
  getPermissions,
  getPermissionsByName,
  newPermissions,
  updatePermissions,
  updateStatePermissions,
} from "../../controllers/rolesAndPermissions/permissionsController.js";
const router = express.Router();

router.post("/", newPermissions);
router.get("/", getPermissions);
router.get("/:nombre", getPermissionsByName);
router.put("/:nombre", updatePermissions);
router.patch("/:nombre/estado", updateStatePermissions);

export default router