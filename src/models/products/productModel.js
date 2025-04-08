import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const ProductSchema = new mongoose.Schema(
  {
    productoId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      unique: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      required: [true, "La descripción es obligatoria"],
    },
    categorias: [
      {
        type: Schema.Types.ObjectId,
        ref: "categorias_Productos",
        required: [true, "Se debe categorizar el producto"],
      },
    ],
    precioCompra: {
      type: Number,
      required: [true, "El precio de compra es requerido"],
      min: [0, "El precio no puede ser negativo"],
    },
    precio: {
      type: Number,
      min: [0, "El precio no puede ser negativo"],
    },
    stock: {
      type: Number,
      min: [0, "El stock no puede ser negativo"],
    },
    img: {
      type: String,
      required: false,
    },
    imgType: {
      type: String,
      enum: ["url", "file"],
      default: "url",
    },
    estado: {
      type: String,
      default: "Activo",
      enum: ["Activo", "Descontinuado", "Agotado", "En oferta"],
    },
  },
  { timestamps: true, versionKey: false }
);

// Agregar un middleware pre-save para calcular automáticamente el precio de venta
ProductSchema.pre("save", function (next) {
  // Si hay precio de compra, calcula el precio de venta con un 15% de ganancia
  if (this.precioCompra) {
    this.precio = Math.round(this.precioCompra * 1.15); // Precio de compra + 15%
  }
  next();
});

// Agregar un método virtual para obtener el precio de venta
ProductSchema.virtual("precioVenta").get(function () {
  return this.precio;
});

// También actualizar precio cuando se actualiza precioCompra
ProductSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.precioCompra) {
    update.precio = Math.round(update.precioCompra * 1.15);
  }
  next();
});

// Middleware para actualizar automáticamente el estado cuando se modifica el stock
ProductSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    const update = this.getUpdate();

    // Si se modificó el stock, verificar si es necesario actualizar el estado
    if (update.stock !== undefined) {
      // Si el stock es 0 y el estado no es Descontinuado, cambiar a Agotado
      if (update.stock === 0 && doc.estado !== "Descontinuado") {
        doc.estado = "Agotado";
        await doc.save();
      }
      // Si el stock es mayor a 0 y el estado es Agotado, cambiar a Activo
      else if (update.stock > 0 && doc.estado === "Agotado") {
        doc.estado = "Activo";
        await doc.save();
      }
    }
  }
});

const Products = createAutoIncrementModel(
  "productos",
  ProductSchema,
  "productoId"
);

export default Products;
