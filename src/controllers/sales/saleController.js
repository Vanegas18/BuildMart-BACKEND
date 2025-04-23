import Sale from "../../models/sales/saleModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import mongoose from "mongoose";
import { saleSchema } from "../../middlewares/sales/saleValidation.js";

export const getSales = async (req, res) => {
  try {
    const { id } = req.params;
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

      productData.stock -= producto.cantidad;
      await productData.save();

      total += productData.precio * producto.cantidad;
    }

    const newSale = new Sale({
      clienteId,
      productos: productos.map((p) => ({
        productoId: new mongoose.Types.ObjectId(p.producto),
        cantidad: p.cantidad,
      })),
      total,
      estado: "Pendiente",
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
      "Pendiente",
      "Completada",
      "Cancelada",
      "Reembolsada",
    ];

    if (!validStatuses.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const venta = await Sale.findById(id);
    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada." });
    }

    if (venta.estado === "Reembolsada") {
      return res.status(400).json({
        message: "No se puede cambiar el estado, la venta ya está reembolsada.",
      });
    }

    if (venta.estado === "Cancelada") {
      return res.status(400).json({
        message: "No se puede cambiar el estado, la venta ya está cancelada.",
      });
    }

    // Si la venta está en estado "Pendiente" y se pasa a "Cancelada", devolver stock
    if (venta.estado === "Pendiente" && estado === "Cancelada") {
      for (const producto of venta.productos) {
        const productData = await Product.findById(producto.productoId);
        if (productData) {
          productData.stock += producto.cantidad;
          await productData.save();
        }
      }
      venta.estado = estado;
      await venta.save();
      return res.status(200).json({
        message: "Venta cancelada correctamente y stock restaurado.",
      });
    }

    // Si la venta estaba completada y se cancela o reembolsa, también se devuelve stock
    if (
      venta.estado === "Completada" &&
      (estado === "Reembolsada" || estado === "Cancelada")
    ) {
      for (const producto of venta.productos) {
        const productData = await Product.findById(producto.productoId);
        if (productData) {
          productData.stock += producto.cantidad;
          await productData.save();
        }
      }
      venta.estado = estado;
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
