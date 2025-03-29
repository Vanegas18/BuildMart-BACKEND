import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

// Verificar si el modelo ya existe para evitar redefinirlo
const modelExists = mongoose.models.Proveedor;

let Proveedor;

if (modelExists) {
  // Si el modelo ya existe, simplemente reusarlo
  Proveedor = mongoose.models.Proveedor;
} else {
  // Si no existe, crearlo
  const AutoIncrementFactory = mongooseSequence(mongoose);

  const ProveedoresSchema = new mongoose.Schema(
    {
      proveedorId: { type: Number, unique: true },
      nit: {
        type: String,
        required: [true, "El NIT es obligatorio"],
        unique: true,
        trim: true,
      },
      nombre: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        unique: true,
        trim: true,
      },
      direccion: {
        type: String,
        required: [true, "La dirección es obligatoria"],
        trim: true,
      },
      telefono: {
        type: String,
        required: [true, "El número de teléfono es obligatorio"],
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "CategoriasProveedor",
        required: true,
      },
      estado: {
        type: String,
        default: "Activo",
        enum: ["Activo", "Inactivo"],
      },
    },
    { timestamps: true, versionKey: false }
  );

  // Solo aplicar el plugin si el modelo no existía previamente
  ProveedoresSchema.plugin(AutoIncrementFactory, {
    inc_field: "proveedorId",
  });

  Proveedor = mongoose.model("Proveedor", ProveedoresSchema);
}

export default Proveedor;
