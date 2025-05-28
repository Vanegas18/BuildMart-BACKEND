import mongoose, { Schema } from "mongoose";
import { createAutoIncrementModel } from "../../middlewares/modelHelper/modelHelper.js";

// Definir el esquema para las ventas
const saleSchema = new mongoose.Schema(
  {
    ventaId: { type: Number, unique: true },
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientes",
      required: true,
    },
    fecha: { type: Date, default: Date.now },
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
        // Precio unitario al momento de la venta
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
    // Desglose de costos
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
    total: {
      type: Number,
      required: true,
    },
    estado: {
      type: String,
      enum: ["procesando", "enviado", "entregado", "completado", "reembolsado"],
      default: "procesando", // Estado inicial cuando se crea desde un pedido confirmado
    },
    // Referencia al pedido original (opcional)
    pedidoId: {
      type: Number,
      ref: "pedidos",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Middleware para validar que el subtotal coincida con la suma de subtotales de productos
saleSchema.pre("save", function (next) {
  // Calcular subtotal basado en los productos
  const subtotalCalculado = this.productos.reduce((total, producto) => {
    return total + producto.subtotalProducto;
  }, 0);

  const tolerance = 0.01; // Tolerancia para errores de punto flotante

  if (Math.abs(this.subtotal - subtotalCalculado) > tolerance) {
    const error = new Error(
      `El subtotal de la venta (${this.subtotal}) no coincide con la suma de subtotales de productos (${subtotalCalculado})`
    );
    return next(error);
  }

  // Validar que total = subtotal + iva + domicilio
  const calculatedTotal = this.subtotal + this.iva + this.domicilio;

  if (Math.abs(this.total - calculatedTotal) > tolerance) {
    const error = new Error(
      `El total de la venta (${this.total}) no coincide con subtotal + IVA + domicilio (${calculatedTotal})`
    );
    return next(error);
  }

  next();
});

// Middleware para validar subtotal de cada producto antes de guardar
saleSchema.pre("save", function (next) {
  const tolerance = 0.01;

  for (const producto of this.productos) {
    const subtotalEsperado = producto.cantidad * producto.precioUnitario;

    if (Math.abs(producto.subtotalProducto - subtotalEsperado) > tolerance) {
      const error = new Error(
        `El subtotal del producto ${producto.productoId} en la venta (${producto.subtotalProducto}) no coincide con cantidad × precio unitario (${subtotalEsperado})`
      );
      return next(error);
    }
  }

  next();
});

// Crear el modelo para las ventas
const Ventas = createAutoIncrementModel("ventas", saleSchema, "ventaId");

export default Ventas;
