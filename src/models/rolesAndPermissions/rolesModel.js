import mongoose from "mongoose";
import Schema from "mongoose";

const rolesSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del Rol es requerido"],
      unique: true,
      trim: true,
    },
    descripcion: { type: String, trim: true, default: "" },
    permisos: [
      {
        type: Schema.Types.ObjectId,
        ref: "permisos",
      },
    ],
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("roles", rolesSchema);
