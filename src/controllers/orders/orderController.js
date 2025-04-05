import { validationResult } from "express-validator";
import Order from "../../models/orders/orderModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import Sale from "../../models/sales/saleModel.js";
import mongoose from "mongoose"; // Asegúrate de importar mongoose

// Método GET
export const getOrders = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const order = await Order.findById(id)
        .populate("clienteId", "nombre")
        .populate("productos.productoId", "nombre precio"); // populate interno para productos
      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      return res.status(200).json(order);
    }
    const orders = await Order.find()
      .populate("clienteId", "nombre")
      .populate("productos.productoId", "nombre precio"); // aquí
    también;
    res.status(200).json(orders);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Método POST - Crear orden
export const createOrder = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { clienteId, productos } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      return res
        .status(400)
        .json({ message: "El clientId proporcionado es válido." });
    }
    const client = await Client.findById(clienteId);
    if (!client) {
      return res.status(404).json({
        message: `Cliente con ID ${clienteId} no encontrado`,
      });
    }
    if (client.estado === "inactivo") {
      return res.status(400).json({
        message: "No se puede crear la orden, el cliente está inactivo.",
      });
    }
    // Verificación de stock y cantidades
    for (const producto of productos) {
      const productoData = await Product.findById(producto.productoId);
      if (!productoData) {
        return res.status(404).json({
          message: `Producto con ID ${producto.productoId} no encontrado.`,
        });
      }
      if (productoData.estado === "No disponible") {
        return res.status(400).json({
          message: `El producto ${productoData.nombre} no está disponible para la venta.`,
        });
      }

      if (producto.cantidad > productoData.stock) {
        return res.status(400).json({
          message: `El producto ${productoData.nombre} solo tiene ${productoData.stock} unidades en stock, no puedes pedir ${producto.cantidad}.`,
        });
      }
      if (producto.cantidad <= 0) {
        return res.status(400).json({
          message: `La cantidad solicitada para el producto ${productoData.nombre} no puede ser cero.`,
        });
      }
      // Descontar stock al crear la orden (solo si el estado es "pendiente")
      productoData.stock -= producto.cantidad;
      await productoData.save();
    }

    // Calcular el total del pedido
    let total = 0;
    for (const producto of productos) {
      const productoData = await Product.findById(producto.productoId);
      total += productoData.precio * producto.cantidad;
    }
    // Crear la orden
    const newOrder = new Order({
      clienteId,
      productos: productos.map((p) => ({
        productoId: new mongoose.Types.ObjectId(p.productoId),
        cantidad: p.cantidad,
      })),
      total,
      estado: "pendiente", // Establecer el estado inicial como "pendiente"
    });
    // Guardar la orden en la base de datos
    await newOrder.save();
    res.status(201).json(newOrder); // Respondemos con el pedido creado
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: "Error al crear el pedido, intente nuevamente." });
  }
};

// Método PUT - Actualizar el estado de la orden
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const order = await Order.findById(id).populate("productos.productoId");
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }
    // Si el estado de la orden es "pagado", no se puede cancelar ni
    modificar;
    if (order.estado === "pagado" && estado === "cancelado") {
      return res
        .status(400)
        .json({ message: "La orden ya está pagada, no se puede cancelar." });
    }
    // Si la orden está en "cancelado", no se puede modificar
    if (order.estado === "cancelado") {
      return res.status(400).json({
        message: "El pedido ya está cancelado y no puede ser modificado.",
      });
    }

    // Permitir el cambio a "cancelado" desde "pendiente"
    if (estado === "cancelado" && order.estado === "pendiente") {
      order.estado = "cancelado";
      // Si la orden estaba en "pendiente" y es cancelada, debemos devolver el stock
      for (const producto of order.productos) {
        const productData = await Product.findById(producto.productoId);
        if (!productData) {
          return res.status(404).json({
            message: `Producto con ID ${producto.productoId} no encontrado`,
          });
        }
        // Devolvemos el stock del producto
        productData.stock += producto.cantidad;
        await productData.save();
      }
    } else if (estado === "pagado" && order.estado === "pendiente") {
      // Si la orden pasa a estado "pagado", ya no se descuentan más productos si ya se hizo antes.
      order.estado = "pagado";

      // Crear la venta correspondiente
      const newSale = new Sale({
        clienteId: order.clienteId,
        productos: order.productos.map((producto) => ({
          productoId: producto.productoId,
          cantidad: producto.cantidad,
        })),
        total: order.total,
        estado: "Completada",
      });
      await newSale.save();
    } else if (estado !== "cancelado" && estado !== "pagado") {
      order.estado = estado;
    }
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al actualizar el estado del pedido, intente nuevamente.",
    });
  }
};
