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
      default: 0,
      min: [0, "El precio no puede ser negativo"],
    },
    precio: {
      type: Number,
      default: 0,
      min: [0, "El precio no puede ser negativo"],
    },
    stock: {
      type: Number,
      default: 0,
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

// Middleware para actualizar automáticamente el estado cuando se modifica el stock
ProductSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();

  // Si se está modificando el stock
  if (update.stock !== undefined || update.$set?.stock !== undefined) {
    const stockValue =
      update.stock !== undefined ? update.stock : update.$set.stock;

    // Obtener el documento actual para verificar el estado
    const doc = await this.model.findOne(this.getQuery());

    if (doc) {
      // Si el stock es 0 y el estado no es Descontinuado, cambiar a Agotado
      if (stockValue === 0 && doc.estado !== "Descontinuado") {
        if (update.$set) {
          update.$set.estado = "Agotado";
        } else {
          update.estado = "Agotado";
        }
      }
      // Si el stock es mayor a 0 y el estado es Agotado, cambiar a Activo
      else if (stockValue > 0 && doc.estado === "Agotado") {
        if (update.$set) {
          update.$set.estado = "Activo";
        } else {
          update.estado = "Activo";
        }
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
