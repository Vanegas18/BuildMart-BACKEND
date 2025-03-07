import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../services/utils/modelHelper.js";

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
    categoriaId: {
      type: Schema.Types.ObjectId,
      ref: "categorias_Productos",
      required: [true, "Se debe categorizar el producto"],
    },
    precio: {
      type: Number,
      required: [true, "El precio es requerido"],
      min: [0, "El precio no puede ser negativo"],
    },
    stock: {
      type: Number,
      default: 10,
      min: [0, "El stock no puede ser negativo"],
    },
    img: {
      type: String,
      required: false,
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

const Products = createAutoIncrementModel(
  "productos",
  ProductSchema,
  "productoId"
);

export default Products;
