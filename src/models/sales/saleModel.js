import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

// Definir el esquema para las ventas
const saleSchema = new mongoose.Schema({
  ventaId: { type: Number, unique: true },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "clientes",
    required: true,
  },
  fecha: { type: Date, default: Date.now },
  productos: [
    {
      productoId: {
        type: Schema.Types.ObjectId,
        ref: "productos",
        required: true,
      },
      cantidad: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  estado: {
    type: String,
    enum: ["Pendiente", "Completada", "Cancelada", "Reembolsada"], // Agregamos el nuevo estado "Reembolsada"
    default: "Pendiente", // Valor por defecto
  },
});

// Crear el modelo para las ventas
const Ventas = createAutoIncrementModel("ventas", saleSchema, "ventaId");

export default Ventas;
