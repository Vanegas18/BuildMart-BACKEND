import express from "express";
const router = express.Router();
import {
  getCategoriesProv,
  getCategoriesProvById,
  newCategorySup,
  updateCategoriesProv,
  updateStateCategoria,
} from "../../controllers/categorySuppliers/catSuppliersController.js";
import { verificarAdmin, verificarAutenticacion } from "../../middlewares/auth/configAuth.js";


router.post("/",verificarAdmin, newCategorySup);
router.get("/",verificarAutenticacion, getCategoriesProv);
router.get("/:categoriesProvId",verificarAdmin, getCategoriesProvById);
router.put("/:categoriesProvId",verificarAdmin, updateCategoriesProv);
router.patch("/:categoriesProvId/estado",verificarAdmin, updateStateCategoria);

export default router;
