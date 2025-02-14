import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const CategorySchema = new mongoose.Schema(
  {
    categoryId: { type: Number },
    nombre: { type: String },
    descripcion: { type: String },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

CategorySchema.plugin(AutoIncrementFactory, {
  id: "Category",
  inc_field: "categoryId",
});

export default mongoose.model("CategoryProduct", CategorySchema)
