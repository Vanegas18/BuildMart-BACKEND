import Sale from "../../models/sales/saleModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import mongoose from "mongoose";
import { saleSchema } from "../../middlewares/sales/saleValidation.js";

// Asegúrate de importar el schema de validación
export const getSales = async (req, res) => {
  try {
    const { id } = req.params;
    // Si hay un id en los parámetros, buscamos una venta específica
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de venta no válido." });
      }
      const venta = await Sale.findById(id)
        .populate("clienteId", "nombre")
        .populate("productos.productoId", "nombre precio");
      if (!venta) {
        return res.status(404).json({ message: "Venta no encontrada." });
      }
      return res.status(200).json(venta);
    }
    // Si no hay id, obtener todas las ventas con cliente y productos
    const ventas = await Sale.find()
      .populate("clienteId", "nombre")
      .populate("productos.productoId", "nombre precio");
    res.status(200).json(ventas);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: "Error al obtener las ventas, intente nuevamente." });
  }
};

export const createSale = async (req, res) => {
  try {
    const parsedData = saleSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: parsedData.error.errors,
      });
    }
    const { clienteId, productos } = parsedData.data;
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        message: "Debe proporcionar al menos un producto en la venta.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      return res
        .status(400)
        .json({ message: "El clientId proporcionado no es válido." });
    }
    const client = await Client.findById(clienteId);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }
    if (client.estado === "inactivo") {
      return res.status(400).json({
        message: "El cliente está inactivo y no puede realizar compras.",
      });
    }
    let total = 0;
    // Descontar el stock mientras validamos la venta
    for (const producto of productos) {
      const productData = await Product.findById(producto.producto);
      if (!productData) {
        return res.status(404).json({
          message: `Producto con ID ${producto.producto} no encontrado.`,
        });
      }
      if (producto.cantidad <= 0) {
        return res.status(400).json({
          message: `La cantidad del producto ${productData.nombre} no puede ser 0 o negativa.`,
        });
      }
      // Verificar si hay suficiente stock
      if (productData.stock < producto.cantidad) {
        return res.status(400).json({
          message: `No hay suficiente stock para el producto ${productData.nombre}.`,
        });
      }
      // Descontar el stock si todo está correcto
      productData.stock -= producto.cantidad;
      await productData.save();
      total += productData.precio * producto.cantidad;
    }
    // Crear la venta en estado "Pendiente"
    const newSale = new Sale({
      clienteId,
      productos: productos.map((p) => ({
        productoId: new mongoose.Types.ObjectId(p.producto),
        cantidad: p.cantidad,
      })),
      total,
      estado: "Pendiente", // El estado inicial es "Pendiente"
    });
    // Guardar la venta en la base de datos
    await newSale.save();
    res.status(201).json({
      message: "Venta creada exitosamente.",
      sale: newSale,
    });
  } catch (error) {
    console.error("Error al crear la venta:", error);
    res
      .status(500)
      .json({ message: "Error al crear la venta, intente nuevamente." });
  }
};

export const updateSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    // Verificar si el estado es válido
    const validStatuses = [
      "Pendiente",
      "Completada",
      "Cancelada",
      "Reembolsada",
    ];
    if (!validStatuses.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }
    // Encontrar la venta por su ID
    const venta = await Sale.findById(id);
    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada." });
    }
    // Si la venta ya está en estado "Reembolsada", no se puede cambiar a ningún otro estado
    if (venta.estado === "Reembolsada") {
      return res.status(400).json({
        message: "No se puede cambiar el estado, la venta ya está reembolsada.",
      });
    }
    // Si la venta ya está en estado "Cancelada", no se puede cambiar
    if (venta.estado === "Cancelada") {
      return res.status(400).json({
        message: "No se puede cambiar el estado, la venta ya está cancelada.",
      });
    }
    // Si el estado es "Pendiente" y estamos pasando a "Cancelada", no hay stock que devolver
    if (venta.estado === "Pendiente" && estado === "Cancelada") {
      venta.estado = estado;
      await venta.save();
      return res
        .status(200)
        .json({ message: "Venta cancelada correctamente." });
    }
    // Si la venta está en estado "Completada" y estamos pasando a "Reembolsada" o "Cancelada", se devuelve el stock.
    if (
      venta.estado === "Completada" &&
      (estado === "Reembolsada" || estado === "Cancelada")
    ) {
      // Devolver el stock de los productos
      for (const producto of venta.productos) {
        const productData = await Product.findById(producto.productoId);
        if (productData) {
          productData.stock += producto.cantidad; // Restauramos el stock
          await productData.save();
        }
      }
      venta.estado = estado; // Actualizamos el estado de la venta
      await venta.save();
      return res.status(200).json({
        message: `Venta actualizada a estado ${estado} y stock restaurado.`,
      });
    }
    if (venta.estado === "Pendiente" && estado === "Completada") {
      venta.estado = estado;
      await venta.save();
      return res.status(200).json({
        message: `Estado de la venta actualizado a ${estado}`,
        sale: venta,
      });
    }
    // Actualizamos el estado de la venta
    venta.estado = estado;
    await venta.save();
    res.status(200).json({
      message: `Estado de la venta actualizado a ${estado}`,
      sale: venta,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la venta:", error);
    res.status(500).json({ message: "Error al actualizar la venta." });
  }
};
