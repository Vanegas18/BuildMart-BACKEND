import express from "express";
const router = express.Router();
import {
  getSuppliers,
  getSuppliersById,
  newSupplier,
  updateStateSupplier,
  updateSupplier,
} from "../../controllers/suppliers/suppliersController.js";

router.post("/", newSupplier);
router.get("/", getSuppliers);
router.get("/:proveedorId", getSuppliersById);
router.put("/:proveedorId", updateSupplier);
router.patch("/:proveedorId/estado", updateStateSupplier);

export default router;
