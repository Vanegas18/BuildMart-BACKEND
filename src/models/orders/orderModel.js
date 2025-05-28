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
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    iva: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    estado: {
      type: String,
      enum: ["pendiente", "confirmado", "rechazado"],
      default: "pendiente",
    },
  },
  { timestamps: true, versionKey: false }
);

// Middleware para validar que total = subtotal + iva
orderSchema.pre("save", function (next) {
  const calculatedTotal = this.subtotal + this.iva;
  const tolerance = 0.01; // Tolerancia para errores de punto flotante

  if (Math.abs(this.total - calculatedTotal) > tolerance) {
    const error = new Error(
      `El total (${this.total}) no coincide con subtotal + IVA (${calculatedTotal})`
    );
    return next(error);
  }

  next();
});

const Orders = createAutoIncrementModel("pedidos", orderSchema, "pedidoId");

export default Orders;
