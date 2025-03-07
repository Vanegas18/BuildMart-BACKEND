import mongoose from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const CategoriaProveedorSchema = new mongoose.Schema(
  {
    categoriaProveedorId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      minlength: 3,
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

const Categoria_Proveedores = createAutoIncrementModel(
  "categoria_Proveedores",
  CategoriaProveedorSchema,
  "categoriaProveedorId"
);

export default Categoria_Proveedores;
