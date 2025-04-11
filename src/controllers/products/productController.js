import Productos from "../../models/products/productModel.js";
import Categorias from "../../models/categoryProduct/categoryModel.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import Pedidos from "../../models/orders/orderModel.js";
// Importaciones necesarias de Firebase
// Importamos lo necesario para Cloudinary (en lugar de Firebase)
import { cloudinary } from "../../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";

import {
  estadoProductSchema,
  ProductSchema,
  updateProductSchema,
} from "../../middlewares/products/productsValidations.js";

console.log("💥 Error completo:\n", util.inspect(error, { depth: null }));
// Agregar nuevo producto
export const newProduct = async (req, res) => {
  console.log("💥 Error completo:\n", util.inspect(error, { depth: null }));
  const { categorias } = req.body;
  try {
    console.log("📦 Body recibido:", JSON.stringify(req.body, null, 2));
    console.log("🖼️ Archivo recibido:", JSON.stringify(req.file, null, 2));

    // Convertir campos numéricos de string a número
    const datosValidados = {
      ...req.body,
      precioCompra: req.body.precioCompra
        ? Number(req.body.precioCompra)
        : undefined,
      stock: req.body.stock ? Number(req.body.stock) : undefined,
    };

    console.log("Archivo recibido:", JSON.stringify(req.file, null, 2));

    // Determinar el tipo de imagen a manejar
    if (datosValidados.imgType === "url" && datosValidados.img) {
      // Usar la URL proporcionada directamente
      // No necesitamos hacer nada, ya que ya está en datosValidados.img
    } else if (req.file) {
      // Si hay un archivo subido, la URL ya fue procesada por Cloudinary y está en req.file.path
      datosValidados.img = req.file.path;
      datosValidados.imgType = "file"; // Cambiar a file ya que subimos un archivo
    }

    // Validar datos con Zod
    const productValidator = ProductSchema.safeParse(datosValidados);
    if (!productValidator.success) {
      return res.status(400).json({
        error: productValidator.error,
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

    if (!productValidator.success) {
      console.log(
        "⚠️ Errores Zod:",
        JSON.stringify(productValidator.error.issues, null, 2)
      );
      return res.status(400).json({ error: productValidator.error });
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
    console.log(
      "💥 Error detallado:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );

    if (error.response) {
      console.log(
        "📡 Respuesta del servidor:",
        JSON.stringify(error.response.data, null, 2)
      );
    }

    console.log(
      "💥 Error detallado:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );

    res.status(500).json({
      error: error.message || "Error desconocido",
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
  const { productoId } = req.params;
  const { categorias } = req.body;

  try {
    // Convertir campos numéricos de string a número
    const datosValidados = {
      ...req.body,
      precioCompra: req.body.precioCompra
        ? Number(req.body.precioCompra)
        : undefined,
      stock: req.body.stock ? Number(req.body.stock) : undefined,
    };

    // Determinar el tipo de imagen a manejar
    if (datosValidados.imgType === "url" && datosValidados.img) {
    } else if (req.file) {
      // Si hay un archivo subido, la URL ya fue procesada por Cloudinary y está en req.file.path
      datosValidados.img = req.file.path;
      datosValidados.imgType = "file"; // Cambiar a file ya que subimos un archivo

      // Opcional: Eliminar la imagen anterior de Cloudinary si existe
      const productoAnterior = await Productos.findOne({ productoId });

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
        } catch (error) {}
      }
    } else if (datosValidados.imgType === "file") {
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
        error: updateProductValidator.error,
      });
    }

    // Obtener la categoría antes de actualizarla para el log
    const productoAnterior = await Productos.findOne({ productoId });
    if (!productoAnterior) {
      return res.status(404).json({ error: "Producto no encontrado" });
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

    // Actualizar el producto
    const producto = await Productos.findOneAndUpdate(
      { productoId },
      datosValidados,
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
      console.error("❌ Error de duplicación (código 11000)");
      return res
        .status(400)
        .json({ error: "El nombre del producto ya está en uso" });
    }

    // Devuelve más detalles sobre el error
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      name: error.name,
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

      // Registrar el cambio automático en el log
      await LogAuditoria.create({
        usuario: "SISTEMA",
        fecha: new Date(),
        accion: "cambiar_estado_automatico",
        entidad: "Producto",
        entidadId: productoId,
        cambios: {
          previo: { estado: producto.estado, stock: producto.stock },
          nuevo: { estado: "Agotado", stock: 0 },
        },
      });
    }

    // Si el producto está Agotado pero tiene stock nuevamente, cambiarlo a Activo
    if (producto.estado === "Agotado" && producto.stock > 0) {
      producto.estado = "Activo";
      await producto.save();

      // Registrar el cambio automático en el log
      await LogAuditoria.create({
        usuario: "SISTEMA",
        fecha: new Date(),
        accion: "cambiar_estado_automatico",
        entidad: "Producto",
        entidadId: productoId,
        cambios: {
          previo: { estado: "Agotado", stock: producto.stock },
          nuevo: { estado: "Activo", stock: producto.stock },
        },
      });
    }

    return producto;
  } catch (error) {
    console.error("Error al actualizar estado según stock:", error);
  }
};
