import mongoose from "mongoose";

const permisoSchema = new mongoose.Schema(
  {
    nombreGrupo: {
      type: String,
      required: [true, "El nombre del grupo de permisos es obligatorio"],
      trim: true,
      unique: false
    },
    permisos: [
      {
        label: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        estado: {
          type: String,
          default: "Activo",
          enum: ["Activo", "Inactivo"],
        },
      },
    ],
    estado: {
      type: String,
      default: "Activo",
      enum: ["Activo", "Inactivo"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("permisos", permisoSchema);
