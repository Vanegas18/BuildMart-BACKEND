import mongoose from "mongoose";
import Schema from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const UserSchema = new mongoose.Schema(
  {
    usuarioId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      trim: true,
    },
    contraseña: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      trim: true,
    },
    telefono: {
      type: String,
      required: [true, "El telefono es obligatorio"],
      unique: true,
      trim: true
    },
    direccion: {
      type: String,
      required: [true, "La dirección es obligatoria"],
    },
    rol: {
      type: Schema.Types.ObjectId,
      ref: "roles",
      default: new mongoose.Types.ObjectId("67b55ac752198cfd60636c36"),
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
  },
  { timestamps: true, versionKey: false }
);

UserSchema.plugin(AutoIncrementFactory, {
  inc_field: "usuarioId",
});

export default mongoose.model("usuarios", UserSchema);
