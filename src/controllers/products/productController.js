import Productos from "../../models/products/productModel.js";
import {
  ProductSchema,
  updateProductSchema,
} from "../../middlewares/products/productsValidations.js";

// Agregar nuevo producto
export const newProduct = async (req, res) => {
  try {
    ProductSchema.parse(req.body);

    const producto = new Productos(req.body);
    await producto.save();

    res
      .status(201)
      .json({ message: "Producto creado exitosamente", data: producto });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener todos los productos
export const getProductos = async (req, res) => {
  try {
    const producto = await Productos.find().populate("categoriaId", "nombre");
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los productos" });
  }
};

// Obtener producto por Id
export const getProductById = async (req, res) => {
  const { productoId } = req.params;
  try {
    const producto = await Productos.findOne({ productoId }).populate(
      "categoriaId",
      "nombre"
    );
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};

// Actualizar productos
export const updateProduct = async (req, res) => {
  const { productoId } = req.params;
  try {
    updateProductSchema.parse(req.body);

    const producto = await Productos.findOneAndUpdate(
      { productoId },
      req.body,
      { new: true }
    );
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      message: "Producto actualizado exitosamente",
      data: producto,
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Actualizar estado del producto
export const updateStateProduct = async (req, res) => {
  const { productoId } = req.params;
  try {
    const producto = await Productos.findOne({ productoId });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    producto.estado = producto.estado === "Activo" ? "Inactivo" : "Activo";
    await producto.save();

    res.json({
      message: `Cambio de estado exitosamente`,
      data: producto,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al cambiar el estado de el producto" });
  }
};
