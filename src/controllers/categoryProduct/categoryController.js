import Categoria from "../../models/categoryProduct/categoryModel.js";
import {
  categorySchema,
  updateCategorySchema,
} from "../../middlewares/categoryProducto/categoryValidations.js";

// Registrar una nueva categoría
export const newCategory = async (req, res) => {
  try {
    // Validar datos con Zod
    categorySchema.safeParse(req.body);

    const nuevaCategoria = new Categoria(req.body);
    await nuevaCategoria.save();

    res
      .status(201)
      .json({ message: "Categoría creada exitosamente", data: nuevaCategoria });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre de la categoria ya está en uso" });
    }
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener todas las categorías
export const getCategories = async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las categorías" });
  }
};

// Obtener una categoría por ID
export const getCategoryById = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const categoria = await Categoria.findOne({ categoriaId });
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la categoría" });
  }
};

// Actualizar categoría
export const updateCategoria = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    updateCategorySchema.safeParse(req.body);

    const categoria = await Categoria.findOneAndUpdate(
      { categoriaId },
      req.body,
      { new: true }
    );
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({
      message: "Categoría actualizada exitosamente",
      data: categoria,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre de la categoria ya está en uso" });
    }
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Cambiar el estado de la categoría (activar o desactivar)
export const updateStateCategory = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const categoria = await Categoria.findOne({ categoriaId });
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Alternar el estado entre "activo" e "inactivo"
    categoria.estado = categoria.estado === "Activo" ? "Inactivo" : "Activo";
    await categoria.save();

    res.json({
      message: `Estado de categoría actualizado exitosamente`,
      data: categoria,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al cambiar el estado de la categoría" });
  }
};
