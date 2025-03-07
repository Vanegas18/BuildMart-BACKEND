import mongoose from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const clientSchema = new mongoose.Schema(
  {
    clienteId: { type: Number, unique: true },
    nombre: { type: String, required: true },
    correo: {
      type: String,
      required: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
    },
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    departamento: { type: String, required: true },
    ciudad: { type: String, required: true },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
  },
  { timestamps: true, versionKey: false }
);

const Clients = createAutoIncrementModel("clientes", clientSchema, "clienteId");

export default Clients;
