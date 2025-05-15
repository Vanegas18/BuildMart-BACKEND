import express from "express";
import {
  getUserById,
  getUsers,
  newUser,
  updateStateUser,
  updateUser,
} from "../../controllers/users/userController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  resetPassword,
  verifyToken,
} from "../../middlewares/users/auth/userAuth.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:usuarioId/Id", getUserById);
router.post("/", newUser);
router.put("/:usuarioId", updateUser);
router.patch("/:usuarioId/estado", updateStateUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/restablecer-contrasena", forgotPassword);
router.post("/verificar-token-contrasena", resetPassword);
router.get("/verify", verifyToken);

export default router;
