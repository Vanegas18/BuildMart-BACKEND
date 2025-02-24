import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";
import Producto from "../products/productModel.js";
import Proveedor from "../Suppliers/suppliersModel.js";


const AutoIncrementFactory = mongooseSequence(mongoose);

const ShoppingSchema = new mongoose.Schema(
  {
    nit: { 
      type: String, 
      required: [true, "El NIT es obligatorio"],
      unique: [true]
    },
    supplier: { 
      type: String, 
      required: [true, "El nombre del proveedor es obligatorio"]
    },
    date: { 
      type: Date, 
      required: [true, "La fecha es obligatoria"] 
    },
    products: [
      {
        type: mongoose.Schema.Types.Mixed,
        validate: {
          validator: (value) => ShoppingSchema.shape.products.check(value),
          message: "Producto no válido"
        }
      }
    ],
    total: { 
      type: Number, 
      required: [true, "El total es obligatorio"] 
    }
  },
  { timestamps: true, versionKey: false }
);

ShoppingSchema.plugin(AutoIncrementFactory, {
  inc_field: "compraId",
});

const Compra = mongoose.model("Compras", ShoppingSchema);
export default Compra;
