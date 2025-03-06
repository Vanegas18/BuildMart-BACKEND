import Productos from "../../models/products/productModel.js";
import Categorias from "../../models/categoryProduct/categoryModel.js";
import {
  ProductSchema,
  updateProductSchema,
} from "../../middlewares/products/productsValidations.js";

// Agregar nuevo producto
export const newProduct = async (req, res) => {
  const { categoriaId } = req.body;
  try {
    const productValidator = ProductSchema.safeParse(req.body);
    if (!productValidator.success) {
      return res.status(400).json({
        error: productValidator.error,
      });
    }

    const categoriaExistente = await Categorias.findById(categoriaId);
    if (!categoriaExistente) {
      return res.status(404).json({ error: "La categoría no existe" });
    }

    const producto = new Productos(req.body);
    await producto.save();

    res
      .status(201)
      .json({ message: "Producto creado exitosamente", data: producto });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del producto ya está en uso" });
    }
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
  const { categoriaId } = req.body;
  try {
    const updateProductValidator = updateProductSchema.safeParse(req.body);
    if (!updateProductValidator.success) {
      return res.status(400).json({
        error: updateProductValidator.error,
      });
    }

    if (categoriaId) {
      const categoriaExistente = await Categorias.findById(categoriaId);
      if (!categoriaExistente) {
        return res.status(404).json({ error: "La categoría no existe" });
      }
    }

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
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del producto ya está en uso" });
    }
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
