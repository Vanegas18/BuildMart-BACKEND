import mongoose from "mongoose";
import Compra from "../../models/buys/buysModel.js";
import Producto from "../../models/products/productModel.js";
import Proveedor from "../../models/Suppliers/supplierModel.js";
import { compraSchema } from "../../middlewares/buys/buysValidations.js";

// Crear una nueva compra
export const crearCompra = async (req, res) => {
  try {
    // Validar el esquema de la compra antes de procesar los datos
    compraSchema.parse(req.body);

    const { nit, supplier, date, products, estado } = req.body;

    // Convertir la fecha de cadena a objeto Date
    const fechaCompra = new Date(date);

    let total = 0; // Inicializar el total

    // Verificar que todos los productos son ObjectIds válidos, calcular el total y verificar cantidades
    for (let item of products) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) { // Usar item.product en lugar de item.productId
        return res.status(400).json({ error: "Producto no válido" });
      }
      const producto = await Producto.findById(item.product); // Usar item.product
      if (!producto) {
        return res.status(400).json({ error: "Producto no encontrado" });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ error: "Cantidad no válida para el producto" });
      }
      total += producto.precio * item.quantity; // Calcular el total
    }

    // Verificar que el proveedor es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(supplier)) {
      return res.status(400).json({ error: "Proveedor no válido", });
    }
    
    const proveedor = await Proveedor.findById(supplier);
    if (!proveedor) {
      return res.status(400).json({ error: "Proveedor no encontrado" });
    }

    // Crear la compra
    const nuevaCompra = new Compra({
      supplier,
      date: fechaCompra,
      products,
      total, // Asignar el total calculado
      estado, // Asignar el estado
    });

    await nuevaCompra.save();
    res.status(201).json({
      message: "Compra creada exitosamente",
      data: nuevaCompra,
    });
  } catch (error) {
    // Capturar errores de validación de Zod
    if (error.errors) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};
// Actualizar una compra por ID
export const actualizarCompra = async (req, res) => {
  const { compraId } = req.params;
  try {
    // Convertir la fecha de cadena a objeto Date
    if (req.body.date) {
      req.body.date = new Date(req.body.date);
    }

    const { supplier, date, products } = req.body;

    let total = 0;

    // Verificar que todos los productos son ObjectIds válidos y calcular el total
    if (products) {
      for (let productoId of products) {
        if (!mongoose.Types.ObjectId.isValid(productoId)) {
          return res.status(400).json({ error: "Producto no válido" });
        }
        const producto = await Producto.findById(productoId);
        if (!producto) {
          return res.status(400).json({ error: "Producto no encontrado" });
        }
        total += producto.precio; // Sumar el precio del producto al total
      }
    }

    // Verificar que el proveedor es un ObjectId válido
    if (supplier && !mongoose.Types.ObjectId.isValid(supplier)) {
      return res.status(400).json({ error: "Proveedor no válido" });
    }
    const proveedor = supplier ? await Proveedor.findById(supplier) : null;
    if (supplier && !proveedor) {
      return res.status(400).json({ error: "Proveedor no encontrado" });
    }

    updateCompraSchema.parse(req.body); // Validar el esquema de actualización de la compra

    const compraActualizada = await Compra.findByIdAndUpdate(
      compraId,
      {
        supplier,
        date,
        products,
        total,
        estado: req.body.estado || "Activa" // Default estado to "Activa" if not provided
      },
      { new: true }
    );

    if (!compraActualizada) return res.status(404).json({ error: 'Compra no encontrada' });

    res.status(200).json({
      message: "Compra actualizada exitosamente",
      data: compraActualizada
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener una compra por ID
export const obtenerCompra = async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id)
      .populate('products')
      .populate('supplier');
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
    res.status(200).json(compra);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la compra' });
  }
};

// Obtener todas las compras
export const obtenerCompras = async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate('products')
      .populate('supplier');
    res.status(200).json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las compras' });
  }
};

// Eliminar una compra por ID
export const eliminarCompra = async (req, res) => {
  const { compraId } = req.params;
  try {
    const compraEliminada = await Compra.findByIdAndDelete(compraId);
    if (!compraEliminada) return res.status(404).json({ error: 'Compra no encontrada' });
    res.status(200).json({
      message: "Compra eliminada exitosamente"
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la compra' });
  }
};

// Cambiar el estado de la compra (Activa o Inactiva)
export const cambiarEstadoCompra = async (req, res) => {
  const { compraId } = req.params;
  try {
    const compra = await Compra.findById(compraId);
    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }
    compra.estado = compra.estado === "Activa" ? "Inactiva" : "Activa";
    await compra.save();

    res.json({
      message: "Cambio de estado exitoso",
      data: compra
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al cambiar el estado de la compra"
    });
  }
};
