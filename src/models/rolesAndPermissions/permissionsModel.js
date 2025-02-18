import mongoose from "mongoose";

const permissionsSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del permiso es obligatorio"],
      unique: true,
    },
    descripcion: {
      type: String,
      trim: true,
      required: [true, "La descripción del permiso es obligatorio"],
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Permissions", permissionsSchema);
