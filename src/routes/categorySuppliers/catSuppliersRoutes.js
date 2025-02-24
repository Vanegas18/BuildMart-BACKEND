import express from "express";
const router = express.Router();
import {
  getCategoriesProv,
  getCategoriesProvById,
  newCategorySup,
  updateCategoriesProv,
  updateStateCategoria,
} from "../../controllers/categorySuppliers/catSuppliersController.js";

router.post("/", newCategorySup);
router.get("/", getCategoriesProv);
router.get("/:categoriesProvId", getCategoriesProvById);
router.put("/:categoriesProvId", updateCategoriesProv);
router.patch("/:categoriesProvId/estado", updateStateCategoria);

export default router;
