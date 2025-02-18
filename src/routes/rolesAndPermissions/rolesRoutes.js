import express from "express";
import {
  getRolByName,
  getRoles,
  newRol,
  updateRol,
  updateStateRol,
} from "../../controllers/rolesAndPermissions/rolesController.js";

const router = express.Router();

router.post("/", newRol);
router.get("/", getRoles);
router.get("/:nombre", getRolByName);
router.put("/:nombre", updateRol);
router.patch("/:nombre/estado", updateStateRol);

export default router;
