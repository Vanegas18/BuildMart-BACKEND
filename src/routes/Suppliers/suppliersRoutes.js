import express from "express";
const router = express.Router();
import{
    getSuppliers,
    getSuppliersById,
    newSupplier,
    updateStateSupplier,
    updateSupplier,
    // deleteSupplier,
} from "../../controllers/Suppliers/suppliersController.js";

router.post("/", newSupplier);
router.get("/", getSuppliers);
router.get("/:proveedorId", getSuppliersById);
router.put("/:proveedorId", updateSupplier);
router.patch("/:proveedorId/estado", updateStateSupplier);

// router.delete("/:proveedorId", deleteSupplier);

export default router;
