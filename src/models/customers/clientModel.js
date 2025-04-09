import mongoose from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const clientSchema = new mongoose.Schema(
  {
    clienteId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      unique: true,
    },
    cedula: {
      type: String,
      required: [true, "La cédula es obligatoria"],
      unique: true,
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
    departamento: {
      type: String,
      required: [true, "El departamento es obligatorio"],
      trim: true,
    },
    ciudad: {
      type: String,
      required: [true, "La ciudad es obligatoria"],
      trim: true,
    },
    estado: { type: String, enum: ["Activo", "Inactivo"], default: "Activo" },
  },
  { timestamps: true, versionKey: false }
);

const Clients = createAutoIncrementModel("clientes", clientSchema, "clienteId");

export default Clients;
