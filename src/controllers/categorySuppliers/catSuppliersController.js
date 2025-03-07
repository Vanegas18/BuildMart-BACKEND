import CategoriasProveedor from "../../models/categorySuppliers/catSuppliersModel.js";
import {
  categorySchema,
  updateCategorySchema,
} from "../../middlewares/categorySuppliers/categoryValidations.js";

//Registrar una categoria de proveedor
export const newCategorySup = async (req, res) => {
  try {
    const catSupplierValidate = categorySchema.safeParse(req.body);
    if (!catSupplierValidate.success) {
      return res.status(400).json({
        error: catSupplierValidate.error,
      });
    }

    const newCategoria = new CategoriasProveedor(req.body);
    await newCategoria.save();

    res.status(201).json({
      message: "Categoría del proveedor creada exitosamente",
      data: newCategoria,
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

//Obtener las categorias del proveedor
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

//Obtener categorías del proveedor por id
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

//Actualizar categorías del proveedor
export const updateCategoriesProv = async (req, res) => {
  const { categoriesProvId } = req.params;
  try {
    const updateCatProveedorValidate = updateCategorySchema.safeParse(req.body);
    if (!updateCatProveedorValidate.success) {
      return res.status(400).json({
        error: updateCatProveedorValidate.error,
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
    res.status(400).json({ error: error.errors || error.message });
  }
};

//Cambiar el estado de la categoria del proveedor(Activo o inactivo)
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
