import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

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
    categorias: [
      {
        type: Schema.Types.ObjectId,
        ref: "categorias_Productos",
        required: [true, "Se debe categorizar el producto"],
      },
    ],
    precioCompra: {
      type: Number,
      default: 0,
      min: [0, "El precio no puede ser negativo"],
    },
    precio: {
      type: Number,
      default: 0,
      min: [0, "El precio no puede ser negativo"],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "El stock no puede ser negativo"],
    },
    img: {
      type: String,
      required: false,
    },
    imgType: {
      type: String,
      enum: ["url", "file"],
      default: "url",
    },
    estado: {
      type: String,
      default: "Activo",
      enum: ["Activo", "Descontinuado", "Agotado", "En oferta"],
    },
    oferta: {
      activa: {
        type: Boolean,
        default: false,
      },
      descuento: {
        type: Number,
        min: [0, "El descuento no puede ser negativo"],
        max: [100, "El descuento no puede ser mayor a 100%"],
        default: 0,
      },
      precioOferta: {
        type: Number,
        min: [0, "El precio de oferta no puede ser negativo"],
        default: 0,
      },
      fechaInicio: {
        type: Date,
        default: null,
      },
      fechaFin: {
        type: Date,
        default: null,
      },
      descripcionOferta: {
        type: String,
        trim: true,
        maxlength: [
          100,
          "La descripción de la oferta no puede exceder 200 caracteres",
        ],
      },
    },
  },
  { timestamps: true, versionKey: false }
);

// Middleware pre-save para creación y actualización directa
ProductSchema.pre("save", async function (next) {
  if (this.isModified("stock")) {
    // Si el stock es 0 y el estado no es Descontinuado, cambiar a Agotado
    if (this.stock === 0 && this.estado !== "Descontinuado") {
      this.estado = "Agotado";
    }
    // Si el stock es mayor a 0 y el estado es Agotado, cambiar a Activo
    else if (this.stock > 0 && this.estado === "Agotado") {
      this.estado = "Activo";
    }
  }
  next();
});

// Middleware para findOneAndUpdate
ProductSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    let cambioEstado = false;

    if (
      doc.stock === 0 &&
      doc.estado !== "Descontinuado" &&
      doc.estado !== "Agotado"
    ) {
      doc.estado = "Agotado";
      cambioEstado = true;
    } else if (doc.stock > 0 && doc.estado === "Agotado") {
      doc.estado = "Activo";
      cambioEstado = true;
    }

    if (cambioEstado) {
      await doc.save();
    }
  }
});

// Middleware para updateOne y updateMany
ProductSchema.post(["updateOne", "updateMany"], async function () {
  const update = this.getUpdate();

  // Si se modificó el stock
  if (
    update.stock !== undefined ||
    update.$set?.stock !== undefined ||
    update.$inc?.stock !== undefined
  ) {
    const docs = await this.model.find(this.getQuery());

    for (const doc of docs) {
      let cambioEstado = false;

      if (
        doc.stock === 0 &&
        doc.estado !== "Descontinuado" &&
        doc.estado !== "Agotado"
      ) {
        doc.estado = "Agotado";
        cambioEstado = true;
      } else if (doc.stock > 0 && doc.estado === "Agotado") {
        doc.estado = "Activo";
        cambioEstado = true;
      }

      if (cambioEstado) {
        await doc.save();
      }
    }
  }
});

// Middleware para actualizar estado automáticamente basado en ofertas
ProductSchema.pre("save", async function (next) {
  // Lógica existente de stock...

  // Nueva lógica para ofertas
  const ahora = new Date();

  if (this.oferta.activa) {
    // Si hay fechas definidas, verificar si la oferta está vigente
    if (this.oferta.fechaInicio && this.oferta.fechaFin) {
      const ofertaVigente =
        ahora >= this.oferta.fechaInicio && ahora <= this.oferta.fechaFin;

      if (!ofertaVigente) {
        this.oferta.activa = false;
        if (this.estado === "En oferta") {
          this.estado = this.stock > 0 ? "Activo" : "Agotado";
        }
      } else {
        this.estado = "En oferta";
      }
    } else {
      // Si no hay fechas, la oferta está activa
      this.estado = "En oferta";
    }
  } else {
    // Si la oferta no está activa, no puede estar en estado "En oferta"
    if (this.estado === "En oferta") {
      this.estado = this.stock > 0 ? "Activo" : "Agotado";
    }
  }

  next();
});

const Products = createAutoIncrementModel(
  "productos",
  ProductSchema,
  "productoId"
);

export default Products;
