import express from "express";
const router = express.Router();
import {
    getSuppliers,
    getSuppliersById,
    newSupplier,
    updateSupplier,
    updateStateSupplier,
} from "../../controllers/Suppliers/suppliersController.js";

router.post("/", newSupplier);
router.get("/", getSuppliers);
router.get("/:proveedorId", getSuppliersById);
router.put("/:proveedorId", updateSupplier);
router.patch("/:proveedorId/estado", updateStateSupplier);

// router.delete("/:proveedorId", eliminarProveedor);

export default router;
