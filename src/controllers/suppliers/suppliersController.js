import Supplier from "../../models/Suppliers/supplierModel.js";
import {
  supplierSchema,
  updateSupplierSchema,
} from "../../middlewares/suppliers/suppliersValidation.js";

//Registrar un nuevo proveedor
export const newSupplier = async (req, res) => {
  try {
    supplierSchema.parse(req.body);

    const nuevoProveedor = new Supplier(req.body);
    await nuevoProveedor.save();

    res
      .status(201)
      .json({ message: "Proveedor creado exitosamente", data: nuevoProveedor });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

//Obtener todos los proveedores
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los proveedores" });
  }
};

//Obtener proveedores por ID
export const getSuppliersById = async (req, res) => {
  const { proveedorId } = req.params;
  try {
    const supplier = await Supplier.findOne({ proveedorId });
    if (!supplier) {
      return res.status(404).json({ error: "Proveedor no encontrada" });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el proveedor" });
  }
};

//Actualizar los proveedores
export const updateSupplier = async (req, res) => {
  const { proveedorId } = req.params;
  try {
    updateSupplierSchema.parse(req.body);

    const supplier = await Supplier.findOneAndUpdate(
      { proveedorId },
      req.body,
      { new: true }
    );
    if (!supplier) {
      return res.status(404).json({ error: "Proveedor no encontrada" });
    }

    res.json({
      message: "Proveedor actualizado exitosamente",
      data: supplier,
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

//Cambiar el estado de la categoria del proveedor(Activo o inactivo)
export const updateStateSupplier = async (req, res) => {
  const { proveedorId } = req.params;
  try {
    const supplier = await Supplier.findOne({ proveedorId: proveedorId });
    if (!supplier) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    supplier.estado = supplier.estado === "Activo" ? "Inactivo" : "Activo";
    await supplier.save();

    res.json({
      message: "Cambio de estado exitoso",
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar el estado del proveedor" });
  }
};
