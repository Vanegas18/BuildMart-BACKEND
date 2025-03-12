import Sale from "../../models/sales/saleModel.js";
import Product from "../../models/products/productModel.js";
import Client from "../../models/customers/clientModel.js";
import mongoose from "mongoose";
import { saleSchema } from "../../middlewares/sales/saleValidation.js"; // Asegúrate de importar el schema de validación

export const getSales = async (req, res) => {
  try {
    const { id } = req.params;

    // Si hay un id en los parámetros, buscamos una venta específica
    if (id) {
      // Verificar si el id es un ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de venta no válido." });
      }

      const venta = await Sale.findById(id).populate("clienteId"); // Buscamos la venta por su id y poblamos el cliente

      if (!venta) {
        return res.status(404).json({ message: "Venta no encontrada." }); // Si no se encuentra la venta
      }

      return res.status(200).json(venta); // Si se encuentra la venta
    }

    // Si no hay id, obtenemos todas las ventas
    const ventas = await Sale.find().populate("clienteId"); // Traemos todas las ventas y poblamos los clientes

    res.status(200).json(ventas); // Devolvemos todas las ventas
  } catch (error) {
    console.error(error.message); // Para debug
    res.status(500).json({ message: "Error al obtener las ventas, intente nuevamente." });
  }
};

export const createSale = async (req, res) => {
  try {
    // Validación de la entrada usando Zod
    const parsedData = saleSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: parsedData.error.errors,
      });
    }

    const { clienteId, productos } = parsedData.data;

    // Verificamos si productos es un array y tiene al menos un elemento
    if (!Array.isArray(productos) || productos.length === 0) {
      return res
        .status(400)
        .json({ message: "Debe proporcionar al menos un producto en la venta." });
    }

    // Verificar si el clienteId es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      return res
        .status(400)
        .json({ message: "El clientId proporcionado no es válido." });
    }

    // Verificar si el cliente existe
    const client = await Client.findById(clienteId);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Verificar si el cliente está activo
    if (client.estado === "inactivo") {
      return res.status(400).json({ message: "El cliente está inactivo y no puede realizar compras." });
    }

    let total = 0;

    // Primero validamos que hay suficiente stock para cada producto
    for (const producto of productos) {
      const productData = await Product.findById(producto.producto);
      if (!productData) {
        return res
          .status(404)
          .json({ message: `Producto con ID ${producto.producto} no encontrado.` });
      }

      // Verificar que la cantidad solicitada sea mayor que 0
      if (producto.cantidad <= 0) {
        return res.status(400).json({
          message: `La cantidad solicitada del producto ${productData.nombre} no puede ser 0 o negativa.`,
        });
      }

      // Verificar si hay suficiente stock
      if (productData.stock < producto.cantidad) {
        return res.status(400).json({
          message: `No hay suficiente stock para el producto ${productData.nombre}. Solo hay ${productData.stock} en stock.`,
        });
      }

      // Calculamos el total de la venta
      total += productData.precio * producto.cantidad;
    }

    // Generar la venta con el estado "Pendiente"
    let newSale = new Sale({
      clienteId,
      productos: productos.map((p) => ({
        productoId: p.producto,
        cantidad: p.cantidad,
      })),
      total: total, // Asignamos el total calculado
      estado: "Pendiente", // Estado por defecto
    });

    // Guardamos la venta, pero no afectamos el stock aún, ya que está en estado "Pendiente"
    await newSale.save();

    res.status(201).json({
      message: "Venta creada exitosamente.",
      sale: newSale,
    });
  } catch (error) {
    console.error("Error al crear la venta:", error); // Mensaje de error más detallado
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
    const validStatuses = ["Pendiente", "Completada", "Cancelada", "Reembolsada"];
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

    // Si el estado es "Cancelada", no se puede cambiar
    if (venta.estado === "Cancelada") {
      return res.status(400).json({ message: "No se puede cambiar el estado, la venta ya está cancelada." });
    }

    // Si el estado es "Pendiente" y estamos pasando a "Cancelada", no hay stock que devolver
    if (venta.estado === "Pendiente" && estado === "Cancelada") {
      venta.estado = estado;
      await venta.save();
      return res.status(200).json({ message: "Venta cancelada correctamente." });
    }

    // Si el estado es "Completada" y ahora estamos pasando a "Reembolsada" o "Cancelada"
    if (venta.estado === "Completada" && (estado === "Reembolsada" || estado === "Cancelada")) {
      // Devuelve el stock de los productos
      for (const producto of venta.productos) {
        const productData = await Product.findById(producto.productoId);
        if (productData) {
          productData.stock += producto.cantidad; // Aumentamos el stock
          await productData.save();
        }
      }
      venta.estado = estado; // Actualizamos el estado de la venta
      await venta.save();
      return res.status(200).json({ message: "Venta actualizada a estado " + estado + " y stock restaurado." });
    }

    // Si la venta está en estado "Pendiente", no se debe afectar el stock al cambiar el estado
    if (venta.estado === "Pendiente" && estado === "Completada") {
      // Descontar el stock solo si la venta pasa a "Completada"
      for (const producto of venta.productos) {
        const productData = await Product.findById(producto.productoId);
        if (productData) {
          if (productData.stock < producto.cantidad) {
            return res.status(400).json({
              message: `No hay suficiente stock para el producto ${productData.nombre}.`,
            });
          }
          productData.stock -= producto.cantidad; // Descontamos el stock
          await productData.save();
        }
      }
    }
  

    // Actualizamos el estado de la venta
    venta.estado = estado;
    await venta.save();
    res.status(200).json({ message: "Estado de la venta actualizado a " + estado, sale: venta });
  } catch (error) {
    console.error("Error al actualizar el estado de la venta:", error);
    res.status(500).json({ message: "Error al actualizar la venta." });
  }
};
