import Sale from "../../models/sales/saleModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import mongoose from "mongoose";
import { saleSchema } from "../../middlewares/sales/saleValidation.js";
import { actualizarEstadoSegunStock } from "../products/productController.js";

export const getSales = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de venta no válido." });
      }
      const venta = await Sale.findById(id)
        .populate("clienteId", "nombre correo telefono")
        .populate("productos.productoId", "nombre precio imagen categoria");
      if (!venta) {
        return res.status(404).json({ message: "Venta no encontrada." });
      }
      return res.status(200).json(venta);
    }
    const ventas = await Sale.find()
      .populate("clienteId", "nombre correo telefono")
      .populate("productos.productoId", "nombre precio imagen categoria")
      .sort({ createdAt: -1 }); // Ordenar por más recientes primero
    res.status(200).json(ventas);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: "Error al obtener las ventas, intente nuevamente." });
  }
};

// Método para crear venta manual (casos excepcionales - normalmente se crean desde pedidos confirmados)
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

    let subtotal = 0;
    let productosIds = [];
    const productosParaVenta = [];

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

      if (productData.stock < producto.cantidad) {
        return res.status(400).json({
          message: `No hay suficiente stock para el producto ${productData.nombre}.`,
        });
      }

      // Calcular precio y subtotal del producto
      const precioUnitario = productData.precio;
      const subtotalProducto = precioUnitario * producto.cantidad;
      subtotal += subtotalProducto;

      // Actualizar stock
      productData.stock -= producto.cantidad;
      await productData.save();
      productosIds.push(producto.producto);

      // Preparar producto para la venta
      productosParaVenta.push({
        productoId: new mongoose.Types.ObjectId(producto.producto),
        cantidad: producto.cantidad,
        precioUnitario: precioUnitario,
        precioOriginal: precioUnitario, // En venta manual, precio original = precio actual
        enOferta: false,
        infoOferta: {
          descuento: 0,
          descripcion: null,
        },
        subtotalProducto: subtotalProducto,
      });
    }

    // Calcular IVA, domicilio y total
    const iva = Math.round(subtotal * 0.08 * 100) / 100; // 8% de IVA
    const domicilio = 15000; // Costo fijo de domicilio
    const total = Math.round((subtotal + iva + domicilio) * 100) / 100;

    // Actualizar estados según stock después de todas las actualizaciones
    await actualizarEstadoSegunStock({ _id: { $in: productosIds } });

    const newSale = new Sale({
      clienteId,
      productos: productosParaVenta,
      subtotal: Math.round(subtotal * 100) / 100,
      iva,
      domicilio,
      total,
      estado: "procesando", // Estado inicial
    });

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

    const validStatuses = [
      "procesando",
      "enviado",
      "entregado",
      "completado",
      "reembolsado",
    ];

    if (!validStatuses.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const venta = await Sale.findById(id);
    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada." });
    }

    // Definir transiciones válidas
    const transicionesValidas = {
      procesando: ["enviado", "reembolsado"],
      enviado: ["entregado", "reembolsado"],
      entregado: ["completado", "reembolsado"],
      completado: ["reembolsado"],
      reembolsado: [], // Estado final
    };

    // Verificar si la transición es válida
    if (!transicionesValidas[venta.estado].includes(estado)) {
      return res.status(400).json({
        message: `No se puede cambiar el estado de '${venta.estado}' a '${estado}'.`,
      });
    }

    // Manejar reembolso
    if (estado === "reembolsado") {
      const productosIds = [];

      for (const producto of venta.productos) {
        const productData = await Product.findById(producto.productoId);
        if (productData) {
          productData.stock += producto.cantidad;
          await productData.save();
          productosIds.push(producto.productoId);
        }
      }

      // Actualizar estados según stock
      await actualizarEstadoSegunStock({ _id: { $in: productosIds } });

      venta.estado = estado;
      await venta.save();

      return res.status(200).json({
        message: "Venta reembolsada correctamente y stock restaurado.",
        venta,
      });
    }

    // Para otros cambios de estado normales
    venta.estado = estado;
    await venta.save();

    res.status(200).json({
      message: `Estado de venta actualizado a '${estado}' correctamente.`,
      venta,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la venta:", error);
    res.status(500).json({ message: "Error al actualizar la venta." });
  }
};
