import { validationResult } from "express-validator";
import Order from "../../models/orders/orderModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import mongoose from "mongoose"; // Asegúrate de importar mongoose

// Metodo GET
export const getOrders = async (req, res) => {
  try {
    const { id } = req.params; // Obtenemos el id de los parámetros de la URL

    if (id) {
      const order = await Order.findById(id); // Buscamos el pedido por su id
      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" }); // Si no se encuentra el pedido
      }
      return res.status(202).json(order);
    }

    const Orders = await Order.find();
    res.status(200).json(Orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Metodo POST
export const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clienteId, productos } = req.body;

  try {
    // Verificar si el clientId es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      return res.status(400).json({ message: "El clientId proporcionado no es válido." });
    }

    // Verificar si el cliente existe y su estado
    const client = await Client.findById(clienteId); // Usamos _id para la búsqueda si clienteId es ObjectId
    if (!client) {
      return res.status(404).json({ message: `Cliente con ID ${clienteId} no encontrado` });
    }

    if (client.estado === "inactivo") {
      return res.status(400).json({
        message: "No se puede crear la orden, el cliente está inactivo.",
      });
    }

    // Verificar el estado de cada producto, la cantidad en stock y la cantidad solicitada
    for (const producto of productos) {
      const productoData = await Product.findById(producto.productoId); // Usamos productoId para la búsqueda

      if (!productoData) {
        return res.status(404).json({
          message: `Producto con ID ${producto.productoId} no encontrado.`,
        });
      }

      // Verificar si el estado del producto es "No disponible"
      if (productoData.estado === "No disponible") {
        return res.status(400).json({
          message: `El producto ${productoData.nombre} no está disponible para la venta.`,
        });
      }

      // Verificar si la cantidad solicitada es mayor que el stock disponible
      if (producto.cantidad > productoData.stock) {
        return res.status(400).json({
          message: `El producto ${productoData.nombre} solo tiene ${productoData.stock} unidades en stock, no puedes pedir ${producto.cantidad}.`,
        });
      }

      // Verificar que la cantidad solicitada no sea 0
      if (producto.cantidad <= 0) {
        return res.status(400).json({
          message: `La cantidad solicitada para el producto ${productoData.nombre} no puede ser cero.`,
        });
      }
    }

    // Calcular el total del pedido
    let total = 0;
    for (const producto of productos) {
      const productoData = await Product.findById(producto.productoId); // Usamos productoId para la búsqueda
      total += productoData.precio * producto.cantidad; // Calculamos el total con el precio y la cantidad
    }

    // Crear el nuevo pedido con la lista de productos y el total calculado
    const newOrder = new Order({
      clienteId,
      productos: productos.map((p) => ({
        productoId: p.productoId,
        cantidad: p.cantidad,
      })),
      total,
    });

    await newOrder.save();
    res.status(201).json(newOrder); // Respondemos con el pedido creado
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error al crear el pedido, intente nuevamente." });
  }
};

// Metodo PUT (Actualizar el estado de la orden)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    // Buscar la orden y sus productos asociados
    const order = await Order.findById(id).populate("productos.productoId");

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    // Si el estado de la orden ya es "pagado", no se puede cancelar
    if (order.estado === "pagado" && estado === "cancelado") {
      return res
        .status(400)
        .json({ message: "La orden ya está pagada, no se puede cancelar." });
    }

    // Si el estado de la orden ya es "cancelado", no se puede modificar
    if (order.estado === "cancelado") {
      return res
        .status(400)
        .json({
          message: "El pedido ya está cancelado y no puede ser modificado.",
        });
    }

    // Si el estado es "pagado", descontamos el stock solo si la orden está en estado "pendiente"
    if (estado === "pagado") {
      if (order.estado === "pagado") {
        // Si ya está pagado, no permitimos modificar el estado
        return res
          .status(400)
          .json({
            message: 'El estado ya es "pagado", no se puede modificar.',
          });
      }

      // Descontamos el stock de los productos solo si el estado está en "pendiente"
      if (order.estado !== "pagado") {
        for (const producto of order.productos) {
          const productData = await Product.findById(producto.productoId);
          if (!productData) {
            return res
              .status(404)
              .json({
                message: `Producto con ID ${producto.productoId} no encontrado`,
              });
          }

          // Verificamos que haya suficiente stock
          if (productData.stock < producto.cantidad) {
            return res
              .status(400)
              .json({
                message: `No hay suficiente stock para el producto ${productData.nombre}`,
              });
          }

          // Descontamos el stock
          productData.stock -= producto.cantidad;
          await productData.save();
        }
      }

      // Finalmente, cambiamos el estado de la orden a "pagado"
      order.estado = "pagado";
    }

    // Si el estado cambia a "cancelado", no se puede cambiar más si ya está en "pagado"
    if (estado === "cancelado" && order.estado !== "pagado") {
      order.estado = "cancelado";
    } else if (estado !== "cancelado" && estado !== "pagado") {
      // Si el estado no es "pagado" ni "cancelado", simplemente se actualiza
      order.estado = estado;
    }

    // Guardar la orden con el nuevo estado
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({
        message:
          "Error al actualizar el estado del pedido, intente nuevamente.",
      });
  }
};
