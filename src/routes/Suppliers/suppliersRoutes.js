import express from "express";
const router = express.Router();
import {
    getSuppliers,
    getSuppliersById,
    newSupplier,
    updateSupplier,
    updateStateSupplier,
} from "../../controllers/Suppliers/suppliersController.js";
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";


router.post("/",verificarAdmin, newSupplier);
router.get("/",verificarAdmin, getSuppliers);
router.get("/:proveedorId",verificarAdmin, getSuppliersById);
router.put("/:proveedorId",verificarAdmin, updateSupplier);
router.patch("/:proveedorId/estado",verificarAdmin, updateStateSupplier);

// router.delete("/:proveedorId", eliminarProveedor);

export default router;
