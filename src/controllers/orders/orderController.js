import { validationResult } from "express-validator";
import Order from "../../models/orders/orderModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import Sale from "../../models/sales/saleModel.js";
import mongoose from "mongoose";
import { enviarCorreoPedido } from "../../middlewares/users/configNodemailer.js";

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
        };
      }
    } else if (producto.oferta.precioOferta > 0) {
      // Si no hay fechas pero la oferta está activa
      return {
        precio: producto.oferta.precioOferta,
        esOferta: true,
        descuento: producto.oferta.descuento,
      };
    }
  }

  // Precio normal si no hay oferta válida
  return {
    precio: producto.precio,
    esOferta: false,
    descuento: 0,
  };
};

// Método GET
export const getOrders = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const order = await Order.findById(id)
        .populate("clienteId", "nombre")
        .populate("productos.productoId", "nombre precio");
      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      return res.status(200).json(order);
    }
    const orders = await Order.find()
      .populate("clienteId", "nombre")
      .populate("productos.productoId", "nombre precio");
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
        .json({ message: "El clientId proporcionado no es válido." });
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

    // Verificación de stock, cantidades y precios
    const productosConDetalles = [];
    let subtotal = 0;

    for (const producto of productos) {
      const productoData = await Product.findById(producto.productoId);
      if (!productoData) {
        return res.status(404).json({
          message: `Producto con ID ${producto.productoId} no encontrado.`,
        });
      }

      // Verificación de estado del producto según los nuevos estados
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

      // Obtener precio efectivo (normal u oferta)
      const precioInfo = obtenerPrecioEfectivo(productoData);
      const precioUnitario = precioInfo.precio;
      const subtotalProducto = precioUnitario * producto.cantidad;

      // Agregar al subtotal
      subtotal += subtotalProducto;

      // Descontar stock al crear la orden (solo si el estado es "pendiente")
      productoData.stock -= producto.cantidad;

      // Actualizar automáticamente el estado si el stock llega a cero
      if (productoData.stock === 0) {
        productoData.estado = "Agotado";
      }

      await productoData.save();

      // Guardar producto con detalles para el correo
      productosConDetalles.push({
        productoId: productoData._id,
        cantidad: producto.cantidad,
        producto: productoData,
        precio: precioUnitario,
        precioOriginal: productoData.precio,
        esOferta: precioInfo.esOferta,
        descuento: precioInfo.descuento,
        subtotal: subtotalProducto,
      });
    }

    // Calcular IVA, domicilio y total
    const iva = subtotal * 0.08; // 8% de IVA
    const domicilio = COSTO_DOMICILIO; // Costo fijo de domicilio
    const total = subtotal + iva + domicilio;

    // Crear la orden
    const newOrder = new Order({
      clienteId,
      productos: productos.map((p) => ({
        productoId: new mongoose.Types.ObjectId(p.productoId),
        cantidad: p.cantidad,
      })),
      subtotal,
      iva,
      domicilio,
      total,
      estado: "pendiente",
    });

    // Guardar la orden en la base de datos
    await newOrder.save();

    // Preparar datos para el correo
    const orderCompleta = {
      ...newOrder._doc,
      items: productosConDetalles,
      _id: newOrder._id,
      subtotal,
      iva,
      domicilio,
      total,
    };

    // Enviar correo de confirmación
    try {
      await enviarCorreoPedido(orderCompleta, client);
      console.log(`✅ Correo de confirmación enviado a ${client.correo}`);
    } catch (emailError) {
      console.error(
        `❌ Error al enviar el correo de confirmación: ${emailError.message}`
      );
      // No devolvemos error al cliente, solo lo registramos
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al crear el pedido, intente nuevamente.",
      error,
    });
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
    }
    // Manejar cambio a "confirmado"
    else if (estado === "confirmado" && order.estado === "pendiente") {
      order.estado = "confirmado";

      // Crear la venta correspondiente
      const newSale = new Sale({
        clienteId: order.clienteId,
        productos: order.productos.map((producto) => ({
          productoId: producto.productoId,
          cantidad: producto.cantidad,
        })),
        subtotal: order.subtotal,
        iva: order.iva,
        domicilio: order.domicilio, // Incluir domicilio en la venta
        total: order.total,
        estado: "procesando",
      });

      await newSale.save();

      // Opcional: Agregar referencia a la venta en el pedido
      // order.ventaId = newSale._id;
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