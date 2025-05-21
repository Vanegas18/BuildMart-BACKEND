import { z } from "zod";
import mongoose from "mongoose";

// Validación para productos en una compra con cantidad
const ProductoEnCompraSchema = z.object({
  producto: z
    .string()
    .nonempty({ message: "El ID del producto es obligatorio" })
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: "El ID del producto no es válido",
    }),
  cantidad: z
    .number()
    .int()
    .positive({ message: "La cantidad debe ser un número entero positivo" }),
        // Permitir cualquier tipo y convertir a número
        precioCompra: z
          .any()
          .transform(val => Number(val) || 0),
        precioVenta: z
          .any()
          .transform(val => Number(val) || 0),
});

// Validación del esquema de compras
export const compraSchema = z.object({
  proveedor: z
    .string()
    .nonempty({ message: "El ID del proveedor es obligatorio" })
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: "El ID del proveedor no es válido",
    }),
  fecha: z.string().datetime({ message: "La fecha debe ser una cadena de fecha y hora válida" }), 
  productos: z
    .array(ProductoEnCompraSchema)
    .nonempty({ message: "Debe haber al menos un producto" }),
  estado: z
    .enum(["Pendiente", "Procesando", "Completado", "Cancelado"], {
      message: "El estado solo puede ser 'Pendiente', 'Procesando', 'Completado' o 'Cancelado'",
    })
    .optional(),
});

// Validación del esquema de actualización de compras
export const updateCompraSchema = z.object({
  estado: z
    .enum(["Pendiente", "Procesando", "Completado", "Cancelado"], {
      message: "El estado solo puede ser 'Pendiente', 'Procesando', 'Completado' o 'Cancelado'",
    }).optional()
});