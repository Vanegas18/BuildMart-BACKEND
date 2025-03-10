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

      const sale = await Sale.findById(id); // Buscamos la venta por su id y poblamos la relación con el cliente

      if (!sale) {
        return res.status(404).json({ message: "Venta no encontrada." }); // Si no se encuentra la venta
      }

      return res.status(200).json(sale); // Si se encuentra la venta
    }

    // Si no hay id, obtenemos todas las ventas
    const sales = await Sale.find().populate("saleId"); // Traemos todas las ventas y poblamos los clientes

    res.status(200).json(sales); // Devolvemos todas las ventas
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

    let total = 0;

    // Recorrer los productos, verificar stock y calcular el total
    for (const producto of productos) {
      const productData = await Product.findById(producto.producto);
      if (!productData) {
        return res
          .status(404)
          .json({
            message: `Producto con ID ${producto.producto} no encontrado.`,
          });
      }

      // Verificamos que haya suficiente stock
      if (productData.stock < producto.cantidad) {
        return res
          .status(400)
          .json({
            message: `No hay suficiente stock para el producto ${productData.nombre}.`,
          });
      }

      // Calculamos el total de la venta
      total += productData.precio * producto.cantidad;

      // Descontamos el stock de cada producto
      productData.stock -= producto.cantidad;
      await productData.save();
    }

    // Generar un saleId único (asegurándonos de que no se repita)
    const lastSale = await Sale.findOne().sort({ saleId: -1 }).limit(1);
    const newSaleId = lastSale ? lastSale.saleId + 1 : 1; // Si no hay ventas previas, empieza desde 1

    // Crear la venta
    const newSale = new Sale({
      clienteId,
      productos: productos.map((p) => ({
        productoId: p.producto,
        cantidad: p.cantidad,
      })),
      total,
      saleId: newSaleId,
    });

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
