import mongoose from "mongoose";
import { z } from "zod";

// Validación para productos en una compra con cantidad
const ProductInCompraSchema = z.object({
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
});

// Validación del esquema de compras
export const compraSchema = z.object({
  proveedor: z
    .string()
    .nonempty({ message: "El ID del proveedor es obligatorio" })
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: "El ID del proveedor no es válido",
    }),
  fecha: z.string().datetime({
    message: "La fecha debe ser una cadena de fecha y hora válida",
  }),
  productos: z.array(ProductInCompraSchema).nonempty({
    message: "Debe incluir al menos un producto",
  }),
  total: z
    .number()
    .positive({
      message: "El total debe ser un número positivo",
    })
    .optional(),
  estado: z.enum(["Activo", "Inactivo"]).default("Activo"),
});

export const updateCompraSchema = compraSchema.partial();
