import express from "express";
import {
  getUserById,
  getUsers,
  newUser,
  updateStateUser,
  updateUser,
} from "../../controllers/users/userController.js";
const router = express.Router();

router.post("/", newUser);
router.get("/", getUsers);
router.get("/:usuarioId", getUserById);
router.put("/:usuarioId", updateUser);
router.patch("/:usuarioId/estado", updateStateUser);

export default router;
