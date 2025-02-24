import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const SuppliersSchema = new mongoose.Schema(
  {
    proveedorId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      unique: true,
      trim: true,
    },
    direccion: {
      type: String,
      required: [true, "La direccion es obligatoria"],
      unique: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: [true, "El numero de telefono es obligatorio"],
      unique: true,
      trim: true,
    },
    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      trim: true,
    },
    categoriaProveedorId: {
      type: mongoose.Schema.Types.ObjectId, //Con esto traemos el modelo al cual vamos a hacer referencia
      ref: "CategoriasProveedor", //Con esto traemos el objeto el cual vamos a referenciar, en este caso el id de la categoría
      required: true,
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);
SuppliersSchema.plugin(AutoIncrementFactory, {
  inc_field: "proveedorId",
});

const Supplier = mongoose.model("Proveedores", SuppliersSchema);

export default Supplier;
