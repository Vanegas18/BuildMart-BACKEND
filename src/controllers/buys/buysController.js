import mongoose from "mongoose";
import Compra from "../../models/buys/buysModel.js";
import Producto from "../../models/products/productModel.js";
import Proveedor from "../../models/Suppliers/supplierModel.js";
import { compraSchema, updateCompraSchema } from "../../middlewares/buys/buysValidations.js";
import { z } from "zod";

// Crear una nueva compra
export const crearCompra = async (req, res) => {
  try {
    // Validar el esquema de la compra antes de procesar los datos
    compraSchema.parse(req.body);

    const { proveedor, fecha, productos, estado } = req.body;

    // Convertir la fecha de cadena a objeto Date
    const fechaCompra = new Date(fecha);

    let total = 0; // Inicializar el total

    // Verificar que todos los productos son ObjectIds válidos, calcular el total y verificar cantidades
    for (let item of productos) {
      if (!mongoose.Types.ObjectId.isValid(item.producto)) {
        return res.status(400).json({ error: "Producto no válido" });
      }
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(400).json({ error: "Productos no existentes" });
      }
      if (item.cantidad <= 0) {
        return res.status(400).json({ error: "Cantidad no válida para el producto" });
      }
      if (item.cantidad > producto.stock) {
        return res.status(400).json({ error: `La cantidad de la compra (${item.cantidad}) no puede ser mayor al stock del producto (${producto.stock})` });
      }
      total += producto.precio * item.cantidad; // Calcular el total
    }

    // Verificar que el proveedor es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(proveedor)) {
      return res.status(400).json({ error: "Proveedor no válido" });
    }
    
    const proveedorEncontrado = await Proveedor.findById(proveedor);
    if (!proveedorEncontrado) {
      return res.status(400).json({ error: "Proveedor no encontrado" });
    }

    // Crear la compra
    const nuevaCompra = new Compra({
      proveedor,
      fecha: fechaCompra,
      productos,
      total, // Asignar el total calculado
      estado: estado || "Pendiente", // Asignar el estado, por defecto "Pendiente"
    });

    await nuevaCompra.save();
    res.status(201).json({
      message: "Compra creada exitosamente",
      data: nuevaCompra,
    });
  } catch (error) {
    // Capturar errores de validación de Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

// Actualizar el estado de una compra por ID
export const actualizarEstadoCompra = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    // Validar el esquema de actualización de la compra antes de procesar los datos
    updateCompraSchema.parse(req.body);

    // Verificar que el ID de la compra es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de compra no válido" });
    }

    const compra = await Compra.findById(id);
    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    // Verificar que el nuevo estado es válido
    const estadosValidos = ["Pendiente", "Procesando", "Completado", "Cancelado"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "El estado solo puede ser 'Pendiente', 'Procesando', 'Completado' o 'Cancelado'" });
    }

    compra.estado = estado;
    await compra.save();

    res.json({
      message: "Cambio de estado exitoso",
      data: compra
    });
  } catch (error) {
    // Capturar errores de validación de Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({
      error: "Error al cambiar el estado de la compra"
    });
  }
};

// Obtener una compra por ID
export const obtenerCompra = async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id)
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
    res.status(200).json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las compras' });
  }
};

// Eliminar una compra por ID
export const eliminarCompra = async (req, res) => {
  const { id } = req.params;
  try {
    const compraEliminada = await Compra.findByIdAndDelete(id);
    if (!compraEliminada) return res.status(404).json({ error: 'Compra no encontrada' });
    res.status(200).json({
      message: "Compra eliminada exitosamente"
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la compra' });
  }
};


