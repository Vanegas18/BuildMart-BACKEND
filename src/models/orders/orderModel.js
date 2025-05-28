import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const orderSchema = new mongoose.Schema(
  {
    pedidoId: { type: Number, unique: true },
    fecha: { type: Date, default: Date.now },
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: "clientes",
      required: true,
    },
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
      enum: ["pendiente", "confirmado", "rechazado"],
      default: "pendiente",
    },
  },
  { timestamps: true, versionKey: false }
);

const Orders = createAutoIncrementModel("pedidos", orderSchema, "pedidoId");

export default Orders;
