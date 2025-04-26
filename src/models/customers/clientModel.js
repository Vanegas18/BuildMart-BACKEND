import mongoose from "mongoose";

// Esquema para dirección
const direccionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["Casa", "Trabajo", "Otro"],
      default: "Casa",
    },
    calle: {
      type: String,
      required: [true, "La dirección es obligatoria"],
      trim: true,
    },
    ciudad: {
      type: String,
      required: [true, "La ciudad es obligatoria"],
      trim: true,
    },
    departamento: {
      type: String,
      required: [true, "El departamento es obligatorio"],
      trim: true,
    },
    codigoPostal: {
      type: String,
      trim: true,
    },
    esPrincipal: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// Esquema para método de pago
const metodoPagoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: [
        "Tarjeta de Crédito",
        "Tarjeta de Débito",
        "PSE",
        "Efectivo",
        "Otro",
      ],
      required: [true, "El tipo de método de pago es obligatorio"],
    },
    titular: {
      type: String,
      trim: true,
    },
    numeroTarjeta: {
      type: String,
      trim: true,
      set: function (num) {
        if (num && num.length > 4) {
          return `xxxx-xxxx-xxxx-${num.slice(-4)}`;
        }
        return num;
      },
    },
    fechaExpiracion: {
      type: String,
      trim: true,
    },
    esPrincipal: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const clientSchema = new mongoose.Schema(
  {
    clienteId: { type: Number, unique: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      unique: true,
    },
    cedula: {
      type: String,
      required: [true, "La cédula es obligatoria"],
      unique: true,
      trim: true,
    },
    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Debe ingresar un correo electrónico válido",
      ],
    },
    contraseña: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      trim: true,
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    telefono: {
      type: Number,
      required: [true, "El telefono es obligatorio"],
      unique: true,
    },
    // Mantenemos el campo de dirección principal por compatibilidad
    direccion: {
      type: String,
      required: [true, "La dirección es obligatoria"],
      trim: true,
    },
    departamento: {
      type: String,
      required: [true, "El departamento es obligatorio"],
      trim: true,
    },
    ciudad: {
      type: String,
      required: [true, "La ciudad es obligatoria"],
      trim: true,
    },
    // Nuevos campos para direcciones múltiples y métodos de pago
    direcciones: {
      type: [direccionSchema],
      default: [],
    },
    metodosPago: {
      type: [metodoPagoSchema],
      default: [],
    },
    estado: { type: String, enum: ["Activo", "Inactivo"], default: "Activo" },
  },
  { timestamps: true, versionKey: false }
);

// Middleware para autoincremento de clienteId
clientSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await mongoose
        .model("Counter")
        .findOneAndUpdate(
          { _id: "clienteId" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
      this.clienteId = counter.seq;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Definir modelo de contador (si no existe)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

// Solo crear el modelo si no existe
const counterModel =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Crear y exportar el modelo de cliente
const Clients = mongoose.model("clientes", clientSchema);

export default Clients;
