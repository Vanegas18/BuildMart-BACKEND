import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const CompraSchema = new mongoose.Schema(
  {
    compraId: { type: Number, unique: true },
    proveedorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Proveedor",
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    productos: [ProductoSchema],
    total_compra: {
      type: Number,
      required: true,
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);
CompraSchema.plugin(AutoIncrementFactory, {
  inc_field: "compraId",
});
const Compra = mongoose.model("Compra", CompraSchema);

export default Compra;
