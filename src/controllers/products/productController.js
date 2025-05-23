import Productos from "../../models/products/productModel.js";
import Categorias from "../../models/categoryProduct/categoryModel.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import Pedidos from "../../models/orders/orderModel.js";
import { cloudinary } from "../../utils/cloudinary.js";
import {
  estadoProductSchema,
  ProductSchema,
  updateProductSchema,
} from "../../middlewares/products/productsValidations.js";

// Agregar nuevo producto
export const newProduct = async (req, res) => {
  const { categorias, imageType } = req.body;

  try {
    // Verificar si se recibieron los datos necesarios
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "No se recibieron datos del producto",
      });
    }

    // Preparar los datos del producto
    const datosValidados = {
      ...req.body,
      precioCompra: Number(req.body.precioCompra),
      precio: Number(req.body.precio),
      stock: Number(req.body.stock),
    };

    // Manejar la imagen según el tipo
    if (imageType === "url") {
      // Para URL, usamos el campo img directamente
      if (!req.body.img) {
        return res.status(400).json({
          error: "Se requiere una URL de imagen del producto",
        });
      }
      datosValidados.img = req.body.img;
      datosValidados.imgType = "url";
    } else {
      // Para archivos, verificamos que exista el archivo
      if (!req.file) {
        return res.status(400).json({
          error: "Se requiere una imagen del producto",
        });
      }
      datosValidados.img = req.file.path;
      datosValidados.imgType = "file";
    }

    // Validar datos con Zod
    const productValidator = ProductSchema.safeParse(datosValidados);
    if (!productValidator.success) {
      return res.status(400).json({
        error: "Error de validación",
        details: productValidator.error.issues,
      });
    }

    // Validar si el ID a asociar existe
    if (Array.isArray(categorias)) {
      for (const categoriaId of categorias) {
        const idExistente = await Categorias.findById(categoriaId);
        if (!idExistente) {
          return res
            .status(400)
            .json({ error: `La categoría con ID ${categoriaId} no existe` });
        }
      }
    }

    // Crear y guardar el nuevo producto
    const producto = new Productos(datosValidados);
    await producto.save();

    // Responder con éxito y datos del producto guardado
    res
      .status(201)
      .json({ message: "Producto creado exitosamente", data: producto });
  } catch (error) {
    // Manejar errores específicos
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Ya existe un producto con ese nombre",
      });
    }

    // Error general
    return res.status(500).json({
      error: "Error al crear el producto",
      message: error.message,
    });
  }
};

// Obtener todos los productos
export const getProductos = async (req, res) => {
  try {
    const producto = await Productos.find().populate("categorias", "nombre");
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
      "categorias",
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

// Obtener productos por estado
export const getProductosByEstado = async (req, res) => {
  const { estado } = req.params;

  try {
    // Validar que el estado sea válido
    if (!["Activo", "Descontinuado", "Agotado", "En oferta"].includes(estado)) {
      return res.status(400).json({
        error:
          "Estado inválido. Los estados válidos son: Activo, Descontinuado, Agotado, En oferta",
      });
    }

    const productos = await Productos.find({ estado }).populate(
      "categorias",
      "nombre"
    );

    res.json({
      cantidad: productos.length,
      productos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener los productos por estado",
      detalle: error.message,
    });
  }
};

// Actualizar productos
export const updateProduct = async (req, res) => {
  const { productoId } = req.params; // Este es el valor "2" que viene de la URL
  const { categorias } = req.body.categorias;

  try {
    // Validar que productoId sea un número válido
    const productoIdNumerico = parseInt(productoId);
    if (isNaN(productoIdNumerico)) {
      return res.status(400).json({
        error: "El ID del producto debe ser un número válido",
      });
    }

    // Convertir campos numéricos de string a número
    const datosValidados = {
      ...req.body,
      categorias, // Asignar las categorías ya parseadas
      precioCompra: req.body.precioCompra
        ? Number(req.body.precioCompra)
        : undefined,
      precio: req.body.precio ? Number(req.body.precio) : undefined,
      stock: req.body.stock ? Number(req.body.stock) : undefined,
    };

    // CORRECCIÓN: Buscar por el campo productoId (numérico) en lugar del _id
    const productoAnterior = await Productos.findOne({
      productoId: productoIdNumerico,
    });

    if (!productoAnterior) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Determinar el tipo de imagen a manejar
    if (datosValidados.imgType === "url" && datosValidados.img) {
      // Mantener la URL proporcionada
    } else if (req.file) {
      // Si hay un archivo subido, usar la URL de Cloudinary
      datosValidados.img = req.file.path;
      datosValidados.imgType = "file";

      // Opcional: Eliminar la imagen anterior de Cloudinary si existe
      if (
        productoAnterior &&
        productoAnterior.img &&
        productoAnterior.imgType === "file"
      ) {
        try {
          // Extraer el public_id de la URL de Cloudinary
          const publicId = productoAnterior.img.split("/").pop().split(".")[0];

          if (publicId) {
            await cloudinary.uploader.destroy(`productos/${publicId}`);
          }
        } catch (error) {
          // Continuar aunque falle la eliminación de la imagen anterior
        }
      }
    } else if (datosValidados.imgType === "file" && !req.file) {
      return res.status(400).json({
        error:
          "Se especificó imgType como 'file' pero no se recibió ningún archivo",
      });
    }

    // Validar datos de actualización con Zod
    const updateProductValidator =
      updateProductSchema.safeParse(datosValidados);
    if (!updateProductValidator.success) {
      return res.status(400).json({
        error: updateProductValidator.error.issues,
      });
    }

    // Validar si los IDs de categorías existen
    if (Array.isArray(categorias)) {
      for (const categoriaId of categorias) {
        const categoriaExistente = await Categorias.findById(categoriaId);
        if (!categoriaExistente) {
          return res
            .status(404)
            .json({ error: `La categoría con ID ${categoriaId} no existe` });
        }
      }
    }

    // CORRECCIÓN: Actualizar usando el campo productoId
    const producto = await Productos.findOneAndUpdate(
      { productoId: productoIdNumerico },
      datosValidados,
      { new: true } // Devuelve el documento actualizado
    );

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

    // Devuelve detalles básicos sobre el error
    res.status(500).json({
      error: "Error al actualizar el producto",
      message: error.message,
    });
  }
};

// Actualizar estado del producto
export const updateStateProduct = async (req, res) => {
  const { productoId } = req.params;
  const { nuevoEstado } = req.body;
  try {
    // Validar el nuevo estado con Zod
    const estadoValidator = estadoProductSchema.safeParse(req.body);
    if (!estadoValidator.success) {
      return res.status(400).json({
        error:
          "Estado inválido. Los estados posibles son: Activo, Descontinuado, Agotado, En oferta",
      });
    }

    // Buscar el producto por ID
    const producto = await Productos.findOne({ productoId });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Guardar estado anterior para el log de auditoría
    const estadoAnterior = producto.estado;

    // Si se intenta cambiar a estado Descontinuado, verificar las validaciones
    if (nuevoEstado === "Descontinuado") {
      // Validación 1: No permitir desactivar productos con pedidos pendientes
      const pedidosPendientes = await Pedidos.find({
        "items.producto": producto._id,
        estado: { $in: ["Pendiente", "En proceso"] },
      });

      if (pedidosPendientes.length > 0) {
        return res.status(400).json({
          error:
            "No se puede descontinuar el producto porque tiene pedidos pendientes",
          pedidosPendientes: pedidosPendientes.map((p) => p._id),
        });
      }

      // Validación 2: No permitir desactivar productos con stock disponible
      if (producto.stock > 0) {
        return res.status(400).json({
          error:
            "No se puede descontinuar el producto mientras tenga stock disponible. Por favor, agote el inventario primero o cambie a estado 'Agotado'.",
          stockActual: producto.stock,
        });
      }
    }

    // Asignar el nuevo estado al producto
    producto.estado = nuevoEstado;

    // Guarda el producto
    await producto.save();

    // Responder con éxito y datos actualizados
    res.json({
      message: `Estado del producto cambiado exitosamente a ${nuevoEstado}`,
      data: producto,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al cambiar el estado del producto",
      detalle: error.message,
    });
  }
};

// Función auxiliar para automatizar el cambio de estado según el stock
export const actualizarEstadoSegunStock = async (productoId) => {
  try {
    const producto = await Productos.findOne({ productoId });
    if (!producto) return;

    // Si el producto está en estado Activo o En oferta pero no tiene stock, cambiar a Agotado
    if (
      (producto.estado === "Activo" || producto.estado === "En oferta") &&
      producto.stock === 0
    ) {
      producto.estado = "Agotado";
      await producto.save();
    }

    // Si el producto está Agotado pero tiene stock nuevamente, cambiarlo a Activo
    if (producto.estado === "Agotado" && producto.stock > 0) {
      producto.estado = "Activo";
      await producto.save();
    }

    return producto;
  } catch (error) {
    console.error("Error al actualizar estado según stock:", error);
  }
};
