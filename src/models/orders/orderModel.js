import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

const orderSchema = new mongoose.Schema(
  {
    pedidoId: { type: Number, unique: true },
    fecha: { type: Date, default: Date.now },
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: "clientes",
      required: true,
    },
    productos: [
      {
        productoId: {
          type: Schema.Types.ObjectId,
          ref: "productos",
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
        },
        // Precio unitario al momento de la compra
        precioUnitario: {
          type: Number,
          required: true,
          min: 0,
        },
        // Precio original del producto (sin oferta)
        precioOriginal: {
          type: Number,
          required: true,
          min: 0,
        },
        // Indicador si estaba en oferta
        enOferta: {
          type: Boolean,
          default: false,
        },
        // Información de la oferta (opcional)
        infoOferta: {
          descuento: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
          descripcion: {
            type: String,
            trim: true,
          },
        },
        // Subtotal de este producto (cantidad * precioUnitario)
        subtotalProducto: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    iva: {
      type: Number,
      required: true,
      min: 0,
    },
    domicilio: {
      type: Number,
      default: 15000,
      min: 0,
    },
    direccionEntrega: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'La dirección debe tener al menos 10 caracteres'],
      maxlength: [200, 'La dirección no puede exceder 200 caracteres']
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    estado: {
      type: String,
      enum: ["pendiente", "confirmado", "rechazado"],
      default: "pendiente",
    },
  },
  { timestamps: true, versionKey: false }
);

// Middleware para validar que el subtotal coincida con la suma de subtotales de productos
orderSchema.pre("save", function (next) {
  // Calcular subtotal basado en los productos
  const subtotalCalculado = this.productos.reduce((total, producto) => {
    return total + producto.subtotalProducto;
  }, 0);

  const tolerance = 0.01; // Tolerancia para errores de punto flotante

  if (Math.abs(this.subtotal - subtotalCalculado) > tolerance) {
    const error = new Error(
      `El subtotal (${this.subtotal}) no coincide con la suma de subtotales de productos (${subtotalCalculado})`
    );
    return next(error);
  }

  // Validar que total = subtotal + iva + domicilio
  const calculatedTotal = this.subtotal + this.iva + this.domicilio;

  if (Math.abs(this.total - calculatedTotal) > tolerance) {
    const error = new Error(
      `El total (${this.total}) no coincide con subtotal + IVA + domicilio (${calculatedTotal})`
    );
    return next(error);
  }

  next();
});

// Middleware para validar subtotal de cada producto antes de guardar
orderSchema.pre("save", function (next) {
  const tolerance = 0.01;

  for (const producto of this.productos) {
    const subtotalEsperado = producto.cantidad * producto.precioUnitario;

    if (Math.abs(producto.subtotalProducto - subtotalEsperado) > tolerance) {
      const error = new Error(
        `El subtotal del producto ${producto.productoId} (${producto.subtotalProducto}) no coincide con cantidad × precio unitario (${subtotalEsperado})`
      );
      return next(error);
    }
  }

  next();
});

const Orders = createAutoIncrementModel("pedidos", orderSchema, "pedidoId");

export default Orders;
