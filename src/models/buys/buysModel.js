import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const ShoppingSchema = new mongoose.Schema(
  {
    compraId: { type: Number, unique: true },
    proveedor: {
      type: mongoose.Schema.Types.ObjectId, // Referencia al modelo Proveedor
      ref: "Proveedor", // Nombre del modelo referenciado
      required: [true, "El proveedor es obligatorio"],
    },
    fecha: {
      type: Date,
      required: [true, "La fecha es obligatoria"],
    },
    productos: [
      {
        producto: {
          type: Schema.Types.ObjectId, // Referencia al modelo Producto
          ref: "Producto", // Nombre del modelo referenciado
          required: [true, "El producto es obligatorio"],
        },
        cantidad: {
          type: Number,
          required: [true, "La cantidad es obligatoria"],
        },
      },
    ],
    total: {
      type: Number,
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

const Buys = createAutoIncrementModel("compras", ShoppingSchema, "compraId");

export default Buys;
