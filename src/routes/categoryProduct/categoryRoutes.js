import express from "express";
const router = express.Router();
import {
  getCategories,
  getCategoryById,
  newCategory,
  updateCategoria,
  updateStateCategory,
} from "../../controllers/categoryProduct/categoryController.js";

router.post("/", newCategory);
router.get("/", getCategories);
router.get("/:categoriaId", getCategoryById);
router.put("/:categoriaId", updateCategoria);
router.patch("/:categoriaId/estado", updateStateCategory);

export default router;
