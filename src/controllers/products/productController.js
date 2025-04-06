import Productos from "../../models/products/productModel.js";
import Categorias from "../../models/categoryProduct/categoryModel.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import {
  ProductSchema,
  updateProductSchema,
} from "../../middlewares/products/productsValidations.js";

// Agregar nuevo producto
export const newProduct = async (req, res) => {
  const { categoriaId } = req.body;
  try {
    // Convertir campos numéricos de string a número
    const datosValidados = {
      ...req.body,
      precioCompra: req.body.precioCompra
        ? Number(req.body.precioCompra)
        : undefined,
      stock: req.body.stock ? Number(req.body.stock) : undefined,
    };

    // Validar datos con Zod
    const productValidator = ProductSchema.safeParse(datosValidados);
    if (!productValidator.success) {
      return res.status(400).json({
        error: productValidator.error,
      });
    }

    // Validar si el ID a asociar existe
    const categoriaExistente = await Categorias.findById(categoriaId);
    if (!categoriaExistente) {
      return res
        .status(404)
        .json({ error: `La categoría con ID ${categoriaId} no existe` });
    }

    // Crear y guardar el nuevo producto
    const producto = new Productos(datosValidados);
    await producto.save();

    // Generar log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : "SISTEMA",
      fecha: new Date(),
      accion: "crear",
      entidad: "Producto",
      entidadId: producto._id,
      cambios: {
        previo: null,
        nuevo: producto,
      },
    });

    // Responder con éxito y datos del producto guardado
    res
      .status(201)
      .json({ message: "Producto creado exitosamente", data: producto });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del producto ya está en uso" });
    }
    // Manejar otros errores
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
    // Validar datos de actualización con Zod
    const updateProductValidator = updateProductSchema.safeParse(req.body);
    if (!updateProductValidator.success) {
      return res.status(400).json({
        error: updateProductValidator.error,
      });
    }

    // Obtener la categoría antes de actualizarla para el log
    const productoAnterior = await Productos.findOne({ productoId });
    if (!productoAnterior) {
      return res.status(404).json({ error: "Producto no encontrada" });
    }

    // Validar si el ID a asociar existe
    if (categoriaId) {
      const categoriaExistente = await Categorias.findById(categoriaId);
      if (!categoriaExistente) {
        return res
          .status(404)
          .json({ error: `La categoría con ID ${categoriaId} no existe` });
      }
    }

    // Actualizar el producto
    const producto = await Productos.findOneAndUpdate(
      { productoId },
      req.body,
      { new: true } // Devuelve el documento actualizado
    );

    // Generar log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : "SISTEMA",
      fecha: new Date(),
      accion: "actualizar",
      entidad: "Producto",
      entidadId: productoId,
      cambios: {
        previo: productoAnterior,
        nuevo: producto,
      },
    });

    // Responder con éxito y datos actualizados
    res.json({
      message: "Producto actualizado exitosamente",
      data: producto,
    });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del producto ya está en uso" });
    }
    // Manejar otros errores
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Actualizar estado del producto
export const updateStateProduct = async (req, res) => {
  const { productoId } = req.params;
  try {
    // Buscar el producto por ID
    const producto = await Productos.findOne({ productoId });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Guardar estado anterior para el log de auditoría
    const estadoAnterior = producto.estado;

    // Alternar el estado entre "Disponible" y "No disponible"
    producto.estado =
      producto.estado === "Disponible" ? "No disponible" : "Disponible";

    // Guarda el producto
    await producto.save();

    // Registrar cambio en log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : null,
      fecha: new Date(),
      accion: "cambiar_estado",
      entidad: "Producto",
      entidadId: productoId,
      cambios: {
        previo: { estado: estadoAnterior },
        nuevo: { estado: producto.estado },
      },
    });

    // Responder con éxito y datos actualizados
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
