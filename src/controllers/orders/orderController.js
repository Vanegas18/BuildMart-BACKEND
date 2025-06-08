import { validationResult } from "express-validator";
import Order from "../../models/orders/orderModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import Sale from "../../models/sales/saleModel.js";
import mongoose from "mongoose";
import {
  enviarCorreoPedido,
  enviarCorreoCambioEstadoPedido,
} from "../../middlewares/users/configNodemailer.js";

// Constante para el costo de domicilio
const COSTO_DOMICILIO = 15000;

// Función auxiliar para obtener el precio efectivo del producto
const obtenerPrecioEfectivo = (producto) => {
  const ahora = new Date();

  // Verificar si la oferta está activa
  if (producto.oferta.activa && producto.estado === "En oferta") {
    // Si hay fechas definidas, verificar vigencia
    if (producto.oferta.fechaInicio && producto.oferta.fechaFin) {
      const ofertaVigente =
        ahora >= producto.oferta.fechaInicio &&
        ahora <= producto.oferta.fechaFin;

      if (ofertaVigente && producto.oferta.precioOferta > 0) {
        return {
          precio: producto.oferta.precioOferta,
          esOferta: true,
          descuento: producto.oferta.descuento,
          descripcionOferta:
            producto.oferta.descripcion ||
            `Descuento del ${producto.oferta.descuento}%`,
        };
      }
    } else if (producto.oferta.precioOferta > 0) {
      // Si no hay fechas pero la oferta está activa
      return {
        precio: producto.oferta.precioOferta,
        esOferta: true,
        descuento: producto.oferta.descuento,
        descripcionOferta:
          producto.oferta.descripcion ||
          `Descuento del ${producto.oferta.descuento}%`,
      };
    }
  }

  // Precio normal si no hay oferta válida
  return {
    precio: producto.precio,
    esOferta: false,
    descuento: 0,
    descripcionOferta: null,
  };
};

// Método GET
export const getOrders = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const order = await Order.findById(id)
        .populate("clienteId", "nombre correo telefono")
        .populate("productos.productoId", "nombre precio imagen categoria");
      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      return res.status(200).json(order);
    }
    const orders = await Order.find()
      .populate("clienteId", "nombre correo telefono")
      .populate("productos.productoId", "nombre precio imagen categoria")
      .sort({ createdAt: -1 }); // Ordenar por más recientes primero
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error al obtener pedidos:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Método POST - Crear orden
export const createOrder = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clienteId, productos, direccionEntrega } = req.body;

  try {
    // Validar ObjectId del cliente
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      return res
        .status(400)
        .json({ message: "El clientId proporcionado no es válido." });
    }

    // Verificar que el cliente existe y está activo
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

    // Verificación de stock, cantidades y precios
    const productosParaOrden = [];
    let subtotal = 0;

    for (const producto of productos) {
      // Validar ObjectId del producto
      if (!mongoose.Types.ObjectId.isValid(producto.productoId)) {
        return res.status(400).json({
          message: `El ID del producto ${producto.productoId} no es válido.`,
        });
      }

      const productoData = await Product.findById(producto.productoId);
      if (!productoData) {
        return res.status(404).json({
          message: `Producto con ID ${producto.productoId} no encontrado.`,
        });
      }

      // Verificación de estado del producto
      if (
        productoData.estado === "Descontinuado" ||
        productoData.estado === "Agotado"
      ) {
        return res.status(400).json({
          message: `El producto ${productoData.nombre} no está disponible para la venta. Estado actual: ${productoData.estado}`,
        });
      }

      // Solo productos en estado "Activo" o "En oferta" pueden ser vendidos
      if (
        productoData.estado !== "Activo" &&
        productoData.estado !== "En oferta"
      ) {
        return res.status(400).json({
          message: `El producto ${productoData.nombre} no está en un estado válido para la venta.`,
        });
      }

      // Validar cantidad
      if (!producto.cantidad || producto.cantidad <= 0) {
        return res.status(400).json({
          message: `La cantidad solicitada para el producto ${productoData.nombre} debe ser mayor a cero.`,
        });
      }

      // Verificar stock disponible
      if (producto.cantidad > productoData.stock) {
        return res.status(400).json({
          message: `El producto ${productoData.nombre} solo tiene ${productoData.stock} unidades en stock, no puedes pedir ${producto.cantidad}.`,
        });
      }

      // Obtener precio efectivo (normal u oferta)
      const precioInfo = obtenerPrecioEfectivo(productoData);
      const precioUnitario = precioInfo.precio;
      const subtotalProducto = precioUnitario * producto.cantidad;

      // Agregar al subtotal general
      subtotal += subtotalProducto;

      // Descontar stock al crear la orden (ya que el estado inicial es "pendiente")
      productoData.stock -= producto.cantidad;

      // Actualizar automáticamente el estado si el stock llega a cero
      if (productoData.stock === 0) {
        productoData.estado = "Agotado";
      }

      await productoData.save();

      // Preparar producto para la orden con el nuevo esquema
      productosParaOrden.push({
        productoId: new mongoose.Types.ObjectId(producto.productoId),
        cantidad: producto.cantidad,
        precioUnitario: precioUnitario,
        precioOriginal: productoData.precio,
        enOferta: precioInfo.esOferta,
        infoOferta: precioInfo.esOferta
          ? {
              descuento: precioInfo.descuento,
              descripcion: precioInfo.descripcionOferta,
            }
          : {
              descuento: 0,
              descripcion: null,
            },
        subtotalProducto: subtotalProducto,
      });
    }

    // Calcular IVA, domicilio y total
    const iva = Math.round(subtotal * 0.08 * 100) / 100; // 8% de IVA, redondeado
    const domicilio = COSTO_DOMICILIO;
    const total = Math.round((subtotal + iva + domicilio) * 100) / 100; // Redondeado

    // Crear la orden con el nuevo esquema
    const newOrder = new Order({
      clienteId: new mongoose.Types.ObjectId(clienteId),
      productos: productosParaOrden,
      subtotal: Math.round(subtotal * 100) / 100, // Redondeado
      iva,
      domicilio,
      direccionEntrega,
      total,
      estado: "pendiente",
    });

    // Guardar la orden en la base de datos
    await newOrder.save();

    // Preparar datos para el correo
    const productosConDetalles = productosParaOrden.map((p, index) => ({
      productoId: p.productoId,
      cantidad: p.cantidad,
      precio: p.precioUnitario,
      precioOriginal: p.precioOriginal,
      esOferta: p.enOferta,
      descuento: p.infoOferta.descuento,
      subtotal: p.subtotalProducto,
      producto: productos[index], // Para mantener compatibilidad con el sistema de correos
    }));

    const orderCompleta = {
      ...newOrder._doc,
      items: productosConDetalles,
      _id: newOrder._id,
      pedidoId: newOrder.pedidoId,
      subtotal: newOrder.subtotal,
      iva: newOrder.iva,
      domicilio: newOrder.domicilio,
      total: newOrder.total,
    };

    // Populate los datos del producto para el correo
    const orderConProductos = await Order.findById(newOrder._id)
      .populate("clienteId", "nombre correo telefono nombreNegocio")
      .populate("productos.productoId", "nombre precio descripcion");

    // Enviar correo de confirmación
    try {
      await enviarCorreoPedido(orderConProductos, client);
      console.log(`✅ Correo de confirmación enviado a ${client.correo}`);
    } catch (emailError) {
      console.error(
        `❌ Error al enviar el correo de confirmación: ${emailError.message}`
      );
      // No devolvemos error al cliente, solo lo registramos
    }

    res.status(201).json({
      message: "Pedido creado exitosamente",
      pedido: newOrder,
    });
  } catch (error) {
    console.error("Error al crear pedido:", error.message);

    // Si hay error de validación del modelo (middleware pre-save)
    if (error.message.includes("no coincide")) {
      return res.status(400).json({
        message: "Error en los cálculos del pedido",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Error al crear el pedido, intente nuevamente.",
      error: error.message,
    });
  }
};

// Método PUT - Actualizar el estado de la orden
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de pedido no válido." });
    }

    const order = await Order.findById(id).populate("productos.productoId");
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    // Obtener información del cliente para el correo
    const client = await Client.findById(order.clienteId);
    if (!client) {
      console.error(`Cliente con ID ${order.clienteId} no encontrado`);
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Validar que el estado proporcionado es válido
    const estadosPermitidos = ["pendiente", "confirmado", "rechazado"];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        message: `Estado '${estado}' no válido. Estados permitidos: ${estadosPermitidos.join(
          ", "
        )}`,
      });
    }

    // Validar transiciones de estado permitidas
    const estadosValidos = {
      pendiente: ["confirmado", "rechazado"],
      confirmado: [], // Una vez confirmado, no puede cambiar (se convierte en venta)
      rechazado: [], // Una vez rechazado, no puede cambiar
    };

    if (!estadosValidos[order.estado].includes(estado)) {
      return res.status(400).json({
        message: `No se puede cambiar el estado de '${order.estado}' a '${estado}'.`,
      });
    }

    // Manejar cambio a "rechazado"
    if (estado === "rechazado" && order.estado === "pendiente") {
      order.estado = "rechazado";

      // Devolver el stock de los productos
      for (const producto of order.productos) {
        const productData = await Product.findById(producto.productoId);
        if (!productData) {
          console.error(`Producto con ID ${producto.productoId} no encontrado`);
          continue;
        }

        // Devolvemos el stock del producto
        productData.stock += producto.cantidad;

        // Si el producto estaba agotado y ahora tiene stock, actualizar a Activo
        if (productData.estado === "Agotado" && productData.stock > 0) {
          productData.estado = "Activo";
        }

        await productData.save();
      }

      console.log(`✅ Stock devuelto para pedido rechazado: ${order.pedidoId}`);
    }
    // Manejar cambio a "confirmado"
    else if (estado === "confirmado" && order.estado === "pendiente") {
      order.estado = "confirmado";

      // Crear la venta correspondiente usando los datos detallados del pedido
      const productosVenta = order.productos.map((producto) => ({
        productoId: producto.productoId,
        cantidad: producto.cantidad,
        precioUnitario: producto.precioUnitario,
        precioOriginal: producto.precioOriginal,
        enOferta: producto.enOferta,
        infoOferta: {
          descuento: producto.infoOferta.descuento || 0,
          descripcion: producto.infoOferta.descripcion || null,
        },
        subtotalProducto: producto.subtotalProducto,
      }));

      const newSale = new Sale({
        clienteId: order.clienteId,
        productos: productosVenta,
        subtotal: order.subtotal,
        iva: order.iva,
        domicilio: order.domicilio,
        direccionEntrega: order.direccionEntrega,
        total: order.total,
        estado: "procesando",
        pedidoId: order.pedidoId, // Referencia al pedido original
      });

      await newSale.save();
      console.log(`✅ Venta creada para pedido confirmado: ${order.pedidoId}`);
    }

    await order.save();

    // Enviar correo de notificación de cambio de estado
    try {
      await enviarCorreoCambioEstadoPedido(order, estado, client);
      console.log(
        `✅ Correo de cambio de estado de pedido enviado a ${client.correo}`
      );
    } catch (emailError) {
      console.error(
        `❌ Error al enviar correo de cambio de estado: ${emailError.message}`
      );
      // No devolvemos error al cliente, solo lo registramos
    }

    res.status(200).json({
      message: `Estado del pedido actualizado a '${estado}' exitosamente`,
      pedido: order,
    });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error.message);
    res.status(500).json({
      message: "Error al actualizar el estado del pedido, intente nuevamente.",
      error: error.message,
    });
  }
};
