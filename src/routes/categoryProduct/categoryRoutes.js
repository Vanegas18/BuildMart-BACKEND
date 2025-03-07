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

router.post("/", verificarAdmin, newCategory);
router.put("/:categoriaId", verificarAdmin, updateCategoria);
router.patch("/:categoriaId/estado", verificarAdmin, updateStateCategory);

export default router;
