import mongoose from "mongoose";
import Compra from "../../models/buys/buysModel.js";
import Producto from "../../models/products/productModel.js";
import Proveedor from "../../models/Suppliers/supplierModel.js";
import {
  compraSchema,
  updateCompraSchema,
} from "../../middlewares/buys/buysValidations.js";

// Crear una nueva compra
export const crearCompra = async (req, res) => {
  try {
    const { proveedor, fecha, productos } = req.body;

    // Validar el esquema de la compra antes de procesar los datos
    const compraValidate = compraSchema.safeParse(req.body);
    if (!compraValidate.success) {
      return res.status(400).json({
        error: compraValidate.error,
      });
    }

    // Convertir la fecha de cadena a objeto Date
    const fechaCompra = new Date(fecha);

    let totalCalculado = 0; // Inicializar el total

    // Verificar que todos los productos son ObjectIds válidos, calcular el total y verificar cantidades
    for (let item of productos) {
      if (!mongoose.Types.ObjectId.isValid(item.producto)) {
        // Usar item.product en lugar de item.productId
        return res.status(400).json({ error: "Producto no válido" });
      }
      const producto = await Producto.findById(item.producto); // Usar item.product
      if (!producto) {
        return res.status(400).json({ error: "Producto no encontrado" });
      }
      if (item.cantidad <= 0) {
        return res
          .status(400)
          .json({ error: "Cantidad no válida para el producto" });
      }
      totalCalculado += producto.precio * item.cantidad; // Calcular el total
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
      total: totalCalculado,
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
    const { proveedor, fecha, productos } = req.body;

    // Convertir la fecha de cadena a objeto Date
    if (req.body.fecha) {
      req.body.fecha = new Date(req.body.fecha);
    }

    let totalCalculado = 0;

    // Verificar que todos los productos son ObjectIds válidos y calcular el total
    if (productos) {
      for (let productoId of productos) {
        if (!mongoose.Types.ObjectId.isValid(productoId)) {
          return res.status(400).json({ error: "Producto no válido" });
        }
        const producto = await Producto.findById(productoId);
        if (!producto) {
          return res.status(400).json({ error: "Producto no encontrado" });
        }
        totalCalculado += producto.precio * item.cantidad; // Calcular el total
      }
    }

    // Verificar que el proveedor es un ObjectId válido
    if (proveedor && !mongoose.Types.ObjectId.isValid(proveedor)) {
      return res.status(400).json({ error: "Proveedor no válido" });
    }
    const proveedorEncontrado = proveedor
      ? await Proveedor.findById(proveedor)
      : null;
    if (proveedor && !proveedorEncontrado) {
      return res.status(400).json({ error: "Proveedor no encontrado" });
    }

    const updateCompraValidate = updateCompraSchema.safeParse(req.body);
    if (!updateCompraValidate.success) {
      return res.status(400).json({
        error: updateCompraValidate.error,
      });
    } // Validar el esquema de actualización de la compra

    const compraActualizada = await Compra.findOneAndUpdate(
      { compraId },
      {
        proveedor,
        fecha,
        productos,
        total: totalCalculado,
        estado: req.body.estado || "Activa", // Default estado to "Activa" if not provided
      },
      { new: true }
    );

    if (!compraActualizada)
      return res.status(404).json({ error: "Compra no encontrada" });

    res.status(200).json({
      message: "Compra actualizada exitosamente",
      data: compraActualizada,
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener una compra por ID
export const obtenerCompra = async (req, res) => {
  const { compraId } = req.params;
  try {
    const compra = await Compra.findOne({ compraId });

    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });
    res.status(200).json(compra);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la compra" });
  }
};

// Obtener todas las compras
export const obtenerCompras = async (req, res) => {
  try {
    const compras = await Compra.find();

    res.status(200).json(compras);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las compras" });
  }
};

// Eliminar una compra por ID
export const eliminarCompra = async (req, res) => {
  const { compraId } = req.params;
  try {
    const compraEliminada = await Compra.findByIdAndDelete(compraId);
    if (!compraEliminada)
      return res.status(404).json({ error: "Compra no encontrada" });
    res.status(200).json({
      message: "Compra eliminada exitosamente",
    });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la compra" });
  }
};

// Cambiar el estado de la compra (Activa o Inactiva)
export const cambiarEstadoCompra = async (req, res) => {
  const { compraId } = req.params;
  try {
    const compra = await Compra.findOne({ compraId });
    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }
    compra.estado = compra.estado === "Activo" ? "Inactivo" : "Activo";
    await compra.save();

    res.json({
      message: "Cambio de estado exitoso",
      data: compra,
    });
  } catch (error) {
    res.status(500).json(console.log(error));
  }
};
