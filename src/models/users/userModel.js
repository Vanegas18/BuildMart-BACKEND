import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";


const UserSchema = new mongoose.Schema(
  {
    usuarioId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Debe ingresar un correo electrónico válido",
      ],
    },
    contraseña: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      trim: true,
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    telefono: {
      type: Number,
      required: [true, "El telefono es obligatorio"],
      unique: true,
      trim: true,
      match: [/^\d{7,15}$/, "El teléfono debe contener entre 7 y 15 dígitos"],
    },
    direccion: {
      type: String,
      required: [true, "La dirección es obligatoria"],
      trim: true,
    },
    rol: {
      type: Schema.Types.ObjectId,
      ref: "roles",
      default: new mongoose.Types.ObjectId("67b55ac752198cfd60636c36"),
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

const User = createAutoIncrementModel(
  "usuarios",
  UserSchema,
  "usuarioId"
);

export default User;
