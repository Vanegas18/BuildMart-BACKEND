import mongoose, {Schema} from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

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
});

const Ventas = createAutoIncrementModel("ventas", saleSchema, "ventaId");

export default Ventas;
