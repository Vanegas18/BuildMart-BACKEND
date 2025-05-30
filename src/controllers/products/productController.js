import Productos from "../../models/products/productModel.js";
import Categorias from "../../models/categoryProduct/categoryModel.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import Pedidos from "../../models/orders/orderModel.js";
import { cloudinary } from "../../utils/cloudinary.js";
import {
  estadoProductSchema,
  ProductSchema,
  updateProductSchema,
  OfertaUpdateSchema,
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
// Actualizar productos
export const updateProduct = async (req, res) => {
  const { productoId } = req.params; // Este es el valor "2" que viene de la URL

  try {
    // Validar que productoId sea un número válido
    const productoIdNumerico = parseInt(productoId);
    if (isNaN(productoIdNumerico)) {
      return res.status(400).json({
        error: "El ID del producto debe ser un número válido",
      });
    }

    // CORRECCIÓN: Extraer categorias correctamente
    let categorias = req.body.categorias;

    // Si viene como FormData, las categorías pueden venir como array de strings
    if (Array.isArray(categorias)) {
      // Ya está en formato correcto
    } else if (typeof categorias === "string") {
      // Si viene como string JSON, parsearlo
      try {
        categorias = JSON.parse(categorias);
      } catch (e) {
        // Si no es JSON válido, tratarlo como un solo elemento
        categorias = [categorias];
      }
    } else if (!categorias) {
      // Si no hay categorías, error
      return res.status(400).json({
        error: "Las categorías son requeridas",
      });
    }

    console.log("Categorías recibidas:", categorias);
    console.log("Tipo de categorías:", typeof categorias);

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

    console.log("Datos validados:", datosValidados);

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
      console.log(
        "Errores de validación:",
        updateProductValidator.error.issues
      );
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

    console.log("Producto actualizado:", producto);

    await actualizarEstadoSegunStock(productoIdNumerico);

    // Responder con éxito y datos actualizados
    res.json({
      message: "Producto actualizado exitosamente",
      data: producto,
    });
  } catch (error) {
    console.error("Error en updateProduct:", error);
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

// Actualizar el estado del producto según su stock
export const actualizarEstadoSegunStock = async (filtro) => {
  try {
    // Puede recibir productoId, _id, o un objeto de filtro
    let query;
    if (typeof filtro === "object" && filtro !== null) {
      query = filtro;
    } else {
      query = {
        $or: [{ productoId: filtro }, { _id: filtro }],
      };
    }

    const productos = await Productos.find(query);

    for (const producto of productos) {
      let nuevoEstado = producto.estado;

      if (producto.stock === 0 && producto.estado !== "Descontinuado") {
        nuevoEstado = "Agotado";
      } else if (producto.stock > 0 && producto.estado === "Agotado") {
        nuevoEstado = "Activo";
      }

      if (nuevoEstado !== producto.estado) {
        await Productos.findOneAndUpdate(
          { _id: producto._id },
          { estado: nuevoEstado }
        );
      }
    }
  } catch (error) {
    console.error("Error al actualizar estado según stock:", error);
  }
};

// Crear o actualizar oferta de un producto
export const crearOfertaProducto = async (req, res) => {
  const { productoId } = req.params;

  try {
    // Validar datos de entrada
    const validacion = OfertaUpdateSchema.safeParse(req.body);
    if (!validacion.success) {
      return res.status(400).json({
        error: "Datos de oferta inválidos",
        details: validacion.error.issues,
      });
    }

    // Buscar el producto
    const producto = await Productos.findOne({
      productoId: parseInt(productoId),
    });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Calcular precio de oferta si se proporciona descuento
    let precioOferta = validacion.data.oferta.precioOferta;
    if (validacion.data.oferta.descuento > 0 && precioOferta === 0) {
      precioOferta =
        producto.precio * (1 - validacion.data.oferta.descuento / 100);
    }

    // Actualizar la oferta del producto
    producto.oferta = {
      ...validacion.data.oferta,
      precioOferta: Math.round(precioOferta * 100) / 100, // Redondear a 2 decimales
    };

    await producto.save();

    res.json({
      message: "Oferta actualizada exitosamente",
      data: producto,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar la oferta",
      message: error.message,
    });
  }
};

// Desactivar oferta de un producto
export const desactivarOfertaProducto = async (req, res) => {
  const { productoId } = req.params;

  try {
    const producto = await Productos.findOne({
      productoId: parseInt(productoId),
    });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Desactivar la oferta
    producto.oferta.activa = false;
    await producto.save();

    res.json({
      message: "Oferta desactivada exitosamente",
      data: producto,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al desactivar la oferta",
      message: error.message,
    });
  }
};

// Función para verificar y actualizar ofertas vencidas (ejecutar periódicamente)
export const actualizarOfertasVencidas = async () => {
  try {
    const ahora = new Date();

    const productosConOfertasVencidas = await Productos.find({
      "oferta.activa": true,
      "oferta.fechaFin": { $lt: ahora },
    });

    for (const producto of productosConOfertasVencidas) {
      producto.oferta.activa = false;
      await producto.save();
    }

    console.log(
      `${productosConOfertasVencidas.length} ofertas vencidas actualizadas`
    );
  } catch (error) {
    console.error("Error al actualizar ofertas vencidas:", error);
  }
};
