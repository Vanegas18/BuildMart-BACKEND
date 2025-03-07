import express from "express";
import {
  forgotPassword,
  getUserById,
  getUsers,
  loginUser,
  logoutUser,
  newUser,
  updateStateUser,
  updateUser,
} from "../../controllers/users/userController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

router.get("/", verificarAdmin, getUsers);
router.get("/:usuarioId", getUserById);

router.post("/", newUser);
router.put("/:usuarioId", updateUser);
router.patch("/:usuarioId/estado", verificarAdmin, updateStateUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/restablecer-contrasena", forgotPassword);

export default router;
