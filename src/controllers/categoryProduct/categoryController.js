import Categoria from "../../models/categoryProduct/categoryModel.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import Productos from "../../models/products/productModel.js";
import {
  categorySchema,
  updateCategorySchema,
} from "../../middlewares/categoryProduct/categoryValidations.js";

// Registrar una nueva categoría
export const newCategory = async (req, res) => {
  try {
    // Validar datos con Zod
    const categoryValidator = categorySchema.safeParse(req.body);
    if (!categoryValidator.success) {
      return res.status(400).json({
        error: categoryValidator.error,
      });
    }

    // Crear y guardar la nueva categoría
    const nuevaCategoria = new Categoria(req.body);
    await nuevaCategoria.save();

    // Generar log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : null,
      fecha: new Date(),
      accion: "crear",
      entidad: "Categoria",
      entidadId: nuevaCategoria._id,
      cambios: {
        previo: null,
        nuevo: nuevaCategoria,
      },
    });

    // Responder con éxito y datos de la categoría creada
    res
      .status(201)
      .json({ message: "Categoría creada exitosamente", data: nuevaCategoria });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre de la categoria ya está en uso" });
    }
    // Manejar otros errores
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
    // Validar datos de actualización con Zod
    const updateCategoryValidate = updateCategorySchema.safeParse(req.body);
    if (!updateCategoryValidate.success) {
      return res.status(400).json({
        error: updateCategoryValidate.error,
      });
    }

    // Obtener la categoría antes de actualizarla para el log
    const categoriaAnterior = await Categoria.findOne({ categoriaId });
    if (!categoriaAnterior) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Actualizar la categoría
    const categoria = await Categoria.findOneAndUpdate(
      { categoriaId },
      req.body,
      { new: true } // Devuelve el documento actualizado
    );

    // Generar log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : null,
      fecha: new Date(),
      accion: "actualizar",
      entidad: "Categoria",
      entidadId: categoriaId,
      cambios: {
        previo: categoriaAnterior,
        nuevo: categoria,
      },
    });

    // Responder con éxito y datos actualizados
    res.json({
      message: "Categoría actualizada exitosamente",
      data: categoria,
    });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre de la categoria ya está en uso" });
    }
    // Manejar otros errores
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Cambiar el estado de la categoría (activar o desactivar)
export const updateStateCategory = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    // Buscar la categoría por ID
    const categoria = await Categoria.findOne({ categoriaId });
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Guardar estado anterior para el log de auditoría
    const estadoAnterior = categoria.estado;

    if (categoria.estado === "Activa") {
      const productosAsociados = await Productos.findOne({
        categoriaId: categoriaId,
        estado: "Activo",
      });

      if (productosAsociados.length > 0) {
        return res.status(400).json({
          error:
            "No se puede desactivar la categoría porque tiene productos activos asociados",
          productosAsociados: productosAsociados.length,
        });
      }
    }

    // Alternar el estado entre "activo" e "inactivo"
    categoria.estado = categoria.estado === "Activa" ? "Inactiva" : "Activa";

    // Guarda la categoria
    await categoria.save();

    // Registrar cambio en log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : null,
      fecha: new Date(),
      accion: "cambiar_estado",
      entidad: "Categoria",
      entidadId: categoriaId,
      cambios: {
        previo: { estado: estadoAnterior },
        nuevo: { estado: categoria.estado },
      },
    });

    // Responder con éxito y datos actualizados
    res.json({
      message: `Cambio de estado exitosamente`,
      data: categoria,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al cambiar el estado de la categoría", error });
  }
};
