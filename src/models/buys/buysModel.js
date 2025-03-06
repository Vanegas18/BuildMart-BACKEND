import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const ShoppingSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId, // Referencia al modelo Proveedor
      ref: "Proveedor", // Nombre del modelo referenciado
      required: [true, "El proveedor es obligatorio"],
    },
    date: {
      type: Date,
      required: [true, "La fecha es obligatoria"],
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId, // Referencia al modelo Producto
          ref: "Producto", // Nombre del modelo referenciado
          required: [true, "El producto es obligatorio"],
        },
        quantity: {
          type: Number,
          required: [true, "La cantidad es obligatoria"],
        },
      },
    ],
    total: {
      type: Number,
      required: [true, "El total es obligatorio"],
    },
  estado: 
  {type: String,
    default: "Activo",
    enum: ["Activo", "Inactivo"]
  },
},
  { timestamps: true, versionKey: false }
);

ShoppingSchema.plugin(AutoIncrementFactory, {
  inc_field: "compraId",
});

const Compra = mongoose.model("Compras", ShoppingSchema);
export default Compra;