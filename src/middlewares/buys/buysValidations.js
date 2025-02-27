import { z } from "zod";
import mongoose from "mongoose";

// Validación para productos en una compra con cantidad
const ProductInCompraSchema = z.object({
  product: z
    .string()
    .nonempty({ message: "El ID del producto es obligatorio" })
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: "El ID del producto no es válido",
    }),
  cantidad: z
    .number()
    .int()
    .positive({ message: "La cantidad debe ser un número entero positivo" }),
});

// Validación del esquema de compras
export const compraSchema = z.object({
  supplier: z
    .string()
    .nonempty({ message: "El ID del proveedor es obligatorio" })
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: "El ID del proveedor no es válido",
    }),
  date: z.string().datetime({
    message: "La fecha debe ser una cadena de fecha y hora válida",
  }), // Cambiado a z.string().datetime()
  estado: z.enum(["Activa", "Inactiva"]).optional(),
});
