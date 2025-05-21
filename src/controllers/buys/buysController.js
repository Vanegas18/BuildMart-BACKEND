import mongoose from "mongoose";
import Compra from "../../models/buys/buysModel.js";
import Producto from "../../models/products/productModel.js";
import Proveedor from "../../models/suppliers/supplierModel.js";
import {
  compraSchema,
  updateCompraSchema,
} from "../../middlewares/buys/buysValidations.js";
import { z } from "zod";

// Crear una nueva compra
export const crearCompra = async (req, res) => {
  console.log("BODY RECIBIDO:", req.body);
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
      
      // Obtener el producto actual
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(400).json({ error: "Productos no existentes" });
      }
      
      if (item.cantidad <= 0) {
        return res
          .status(400)
          .json({ error: "Cantidad no válida para el producto" });
      }
      
      // Obtener los precios de compra y venta del request
      // Si no vienen, mantenemos los precios actuales del producto
      const nuevoPrecioCompra = item.precioCompra !== undefined ? item.precioCompra : producto.precioCompra;
      const nuevoPrecioVenta = item.precio !== undefined ? item.precio : producto.precio;
      
      // Actualizar los precios del producto en la base de datos
      await Producto.findByIdAndUpdate(item.producto, {
        precioCompra: nuevoPrecioCompra,
        precio: nuevoPrecioVenta
      });
      
      // Recalcular el total con el precio de compra actualizado
      total += nuevoPrecioCompra * item.cantidad;
      
      // Actualizar el item para que se guarde con el precio actual
      item.precioCompra = nuevoPrecioCompra;
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
      message: "Compra creada exitosamente y precios de productos actualizados",
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

    const compra = await Compra.findById(id).populate("productos.producto");
    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    // Verificar que el nuevo estado es válido
    const estadosValidos = [
      "Pendiente",
      "Procesando",
      "Completado",
      "Cancelado",
    ];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: "El estado solo puede ser 'Pendiente', 'Procesando', 'Completado' o 'Cancelado'"
      });
    }

    // Guardar el estado anterior para verificar el cambio
    const estadoAnterior = compra.estado;
    
    // Si la compra pasa a estado "Completado", actualizar el stock de productos
    if (estado === "Completado" && estadoAnterior !== "Completado") {
      // Recorrer los productos de la compra
      for (const item of compra.productos) {
        const productData = await Producto.findById(item.producto);
        if (productData) {
          // Actualizar el stock sumando la cantidad comprada
          productData.stock += item.cantidad;
          await productData.save();
        }
      }
      compra.estado = estado;
      await compra.save();
      return res.json({
        message: "Compra completada y stock de productos actualizado",
        data: compra,
      });
    }

    // Para cualquier otro cambio de estado
    compra.estado = estado;
    await compra.save();

    res.json({
      message: "Cambio de estado exitoso",
      data: compra,
    });
  } catch (error) {
    // Capturar errores de validación de Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error al cambiar el estado de la compra:", error);
    res.status(500).json({
      error: "Error al cambiar el estado de la compra",
    });
  }
};

// Obtener una compra por ID con populate
export const obtenerCompra = async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id)
      .populate({
        path: "proveedor",
        select: "nombre nit telefono correo direccion" // Selecciona los campos que quieres mostrar
      })
      .populate({
        path: "productos.producto",
        select: "nombre categoria precioVenta precioCompra stock" // Selecciona los campos que quieres mostrar
      });

    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });
    res.status(200).json(compra);
  } catch (error) {
    console.error("Error al obtener la compra:", error);
    res.status(500).json({ error: "Error al obtener la compra" });
  }
};

// Obtener todas las compras
export const obtenerCompras = async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate({
        path: "proveedor",
        select: "nombre nit" // Selecciona solo los campos básicos para la lista
      })
      .populate({
        path: "productos.producto",
        select: "nombre precioCompra" // Selecciona solo los campos básicos para la lista
      });
    res.status(200).json(compras);
  } catch (error) {
    console.error("Error al obtener las compras:", error);
    res.status(500).json({ error: "Error al obtener las compras" });
  }
};
// Eliminar una compra por ID
export const eliminarCompra = async (req, res) => {
  const { id } = req.params;
  try {
    const compraEliminada = await Compra.findByIdAndDelete(id);
    if (!compraEliminada)
      return res.status(404).json({ error: "Compra no encontrada" });
    res.status(200).json({
      message: "Compra eliminada exitosamente",
    });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la compra" });
  }
};