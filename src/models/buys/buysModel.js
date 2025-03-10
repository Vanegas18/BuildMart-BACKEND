import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const ComprasSchema = new mongoose.Schema(
  {
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
          type: mongoose.Schema.Types.ObjectId, // Referencia al modelo Producto
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
      required: [true, "El total es obligatorio"],
    },
    estado: {
      type: String,
      default: "Pendiente",
      enum: ["Pendiente", "Procesando", "Completado", "Cancelado"],
    },
  },
  { timestamps: true, versionKey: false }
);

ComprasSchema.plugin(AutoIncrementFactory, {
  inc_field: "compraId",
});

const Compra = mongoose.model("Compras", ComprasSchema);
export default Compra;