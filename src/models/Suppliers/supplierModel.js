import mongoose from "mongoose";
import { createAutoIncrementModel } from "../../services/utils/modelHelper.js";

const SuppliersSchema = new mongoose.Schema(
  {
    proveedorId: { type: Number, unique: true },
    nit: {
      type: String,
      required: [true, "El NIT es obligatorio"],
      unique: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      unique: true,
      trim: true,
    },
    direccion: {
      type: String,
      required: [true, "La direccion es obligatoria"],
      unique: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: [true, "El numero de telefono es obligatorio"],
      unique: true,
      trim: true,
    },
    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      trim: true,
    },
    categoriaProveedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CategoriasProveedor",
      required: true,
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

const Supplier = createAutoIncrementModel(
  "Proveedores",
  SuppliersSchema,
  "proveedorId"
);

export default Supplier;
