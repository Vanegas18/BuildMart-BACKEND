import mongoose from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const CategorySchema = new mongoose.Schema(
  {
    categoriaId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      unique: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      required: [true, "La descripción es obligatoria"],
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

const Categoria_Products = createAutoIncrementModel(
  "categorias_Productos",
  CategorySchema,
  "categoriaId"
);

export default Categoria_Products;
