import CategoriasProveedor from "../../models/categorySuppliers/catSuppliersModel.js";
import {
  categorySchema,
  updateCategorySchema,
} from "../../middlewares/categorySuppliers/categoryValidations.js";

// Registrar una categoría de proveedor
export const newCategorySup = async (req, res) => {
  try {
    // Validar los datos de la categoría con Zod
    const categoryValidator = categorySchema.safeParse(req.body);
    if (!categoryValidator.success) {
      return res.status(400).json({
        error: categoryValidator.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const newCategoria = new CategoriasProveedor(req.body);
    await newCategoria.save();

    res.status(201).json({
      message: "Categoría del proveedor creada exitosamente",
      data: newCategoria,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res
        .status(400)
        .json({ error: `El ${field} ya está en uso` });
    }
    res.status(500).json({ error: error.message || error.errors });
  }
};

// Obtener las categorías del proveedor
export const getCategoriesProv = async (req, res) => {
  try {
    const categoriasProv = await CategoriasProveedor.find();
    res.json(categoriasProv);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener las categorías de los proveedores" });
  }
};

// Obtener categorías del proveedor por id
export const getCategoriesProvById = async (req, res) => {
  const { categoriesProvId } = req.params;
  try {
    const categoriesProv = await CategoriasProveedor.findOne({
      categoriaProveedorId: categoriesProvId,
    });
    if (!categoriesProv) {
      return res
        .status(404)
        .json({ error: "Categoría del proveedor no encontrada" });
    }
    res.json(categoriesProv);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener la categoría del proveedor" });
  }
};

// Actualizar categorías del proveedor
export const updateCategoriesProv = async (req, res) => {
  const { categoriesProvId } = req.params;
  try {
    // Validar los datos actualizados con Zod
    const updateCategoryValidator = updateCategorySchema.safeParse(req.body);
    if (!updateCategoryValidator.success) {
      return res.status(400).json({
        error: updateCategoryValidator.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const categoriesProv = await CategoriasProveedor.findOneAndUpdate(
      { categoriaProveedorId: categoriesProvId },
      req.body,
      { new: true }
    );
    if (!categoriesProv) {
      return res
        .status(404)
        .json({ error: "Categoría del proveedor no encontrada" });
    }

    res.json({
      message: "Categoría del proveedor actualizada exitosamente",
      data: categoriesProv,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res
        .status(400)
        .json({ error: `El ${field} ya está en uso` });
    }
    res.status(500).json({ error: error.message || error.errors });
  }
};

// Cambiar el estado de la categoría del proveedor (Activo o Inactivo)
export const updateStateCategoria = async (req, res) => {
  const { categoriesProvId } = req.params;
  try {
    const categoriesProv = await CategoriasProveedor.findOne({
      categoriaProveedorId: categoriesProvId,
    });
    if (!categoriesProv) {
      return res
        .status(404)
        .json({ error: "Categoría del proveedor no encontrada" });
    }
    categoriesProv.estado =
      categoriesProv.estado === "Activo" ? "Inactivo" : "Activo";
    await categoriesProv.save();

    res.json({
      message: "Cambio de estado exitoso",
      data: categoriesProv,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al cambiar el estado de la categoría del proveedor",
    });
  }
};
