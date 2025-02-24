import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";
import Schema from "mongoose";

const AutoIncrementFactory = mongooseSequence(mongoose);

const ProductSchema = new mongoose.Schema(
  {
    productoId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      unique: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      required: [true, "La descripción es obligatoria"],
    },
    categoriaId: {
      type: Schema.Types.ObjectId,
      ref: "categoriasProductos",
      required: [true, "Se debe categorizar el producto"],
    },
    precio: {
      type: Number,
      required: [true, "El precio es requerido"],
      min: 0,
    },
    stock: { type: Number, default: 10, min: 0 },
    img: {
      type: String,
      required: [true, "La URL de la imagen es obligatoria"],
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

ProductSchema.plugin(AutoIncrementFactory, {
  inc_field: "productoId",
});

export default mongoose.model("productos", ProductSchema);
