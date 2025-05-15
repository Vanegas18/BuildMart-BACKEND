import express from "express";
const router = express.Router();
import {
  getCategories,
  getCategoryById,
  newCategory,
  updateCategoria,
  updateStateCategory,
} from "../../controllers/categoryProduct/categoryController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

router.get("/", getCategories);
router.get("/:categoriaId", getCategoryById);

router.post("/", newCategory);
router.put("/:categoriaId", updateCategoria);
router.patch("/:categoriaId/estado", updateStateCategory);

export default router;
