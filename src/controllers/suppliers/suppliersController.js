import mongoose from "mongoose";
import Supplier from "../../models/Suppliers/supplierModel.js";
import CategoriasProveedor from "../../models/categorySuppliers/catSuppliersModel.js";
import {
  supplierSchema,
  updateSupplierSchema,
} from "../../middlewares/suppliers/suppliersValidation.js";

// Registrar un nuevo proveedor
export const newSupplier = async (req, res) => {
    const { categoriaProveedorId } = req.body;
  try {
    // Validar los datos del proveedor con Zod
    const supplierValidator = supplierSchema.safeParse(req.body);
    if (!supplierValidator.success) {
      return res.status(400).json({
        error: supplierValidator.error,
      });
    }

    const categoryExists = await CategoriasProveedor.findById(categoriaProveedorId);
    if (!categoryExists) {
        return res
            .status(404)
            .json({ error: `La categoría con ID ${categoriaProveedorId} no existe`})
    }
    
    const nuevoProveedor = new Supplier(req.body);
    await nuevoProveedor.save();

    res.status(201).json({
      message: "Proveedor creado exitosamente",
      data: nuevoProveedor,
    });
    
  } catch (error) {
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
      return res
        .status(400)
        .json({ error: `El ${field} ya está en uso` });
    }
    res.status(500).json({ error: error.message || error.errors });
  }
};

// Obtener todos los proveedores
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().populate("categoriaProveedorId", "nombre");
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los proveedores" });
  }
};

// Obtener proveedor por ID
export const getSuppliersById = async (req, res) => {
  const { proveedorId } = req.params;
  try {
    const supplier = await Supplier.findOne({ proveedorId }).populate(
      "categoriaProveedorId",
      "nombre"
    );
    if (!supplier) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el proveedor" });
  }
};

// Actualizar un proveedor
export const updateSupplier = async (req, res) => {
  const { proveedorId } = req.params;
  try {
    // Validar los datos actualizados con Zod
    const updateSupplierValidator = updateSupplierSchema.safeParse(req.body);
    if (!updateSupplierValidator.success) {
      return res.status(400).json({
        error: updateSupplierValidator.error.errors.map((err) => err.message),
      });
    }

    // Validar ID de categoría si se incluye
    const { categoriaProveedorId } = req.body;
    if (categoriaProveedorId && !mongoose.Types.ObjectId.isValid(categoriaProveedorId)) {
      return res.status(400).json({ error: "El ID de la categoría no es válido" });
    }

    const supplier = await Supplier.findOneAndUpdate(
      { proveedorId },
      req.body,
      { new: true }
    );
    if (!supplier) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json({
      message: "Proveedor actualizado exitosamente",
      data: supplier,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El NIT o el correo del proveedor ya está en uso" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Cambiar el estado del proveedor
export const updateStateSupplier = async (req, res) => {
  const { proveedorId } = req.params;
  try {
    const supplier = await Supplier.findOne({ proveedorId });
    if (!supplier) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    // Alternar estado entre Activo e Inactivo
    supplier.estado = supplier.estado === "Activo" ? "Inactivo" : "Activo";
    await supplier.save();

    res.json({
      message: "Estado del proveedor cambiado exitosamente",
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar el estado del proveedor" });
  }
};
