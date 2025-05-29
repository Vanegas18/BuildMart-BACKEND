import { z } from "zod";

// Esquema de validación para la creación de una orden
export const orderSchema = z.object({
  clienteId: z
    .string()
    .nonempty({ message: "El ID del cliente es obligatorio" })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "El ID del cliente debe ser un ObjectId válido",
    }),

  productos: z
    .array(
      z.object({
        productoId: z
          .string()
          .nonempty({ message: "El ID del producto es obligatorio" })
          .regex(/^[0-9a-fA-F]{24}$/, {
            message: "El ID del producto debe ser un ObjectId válido",
          }),
        cantidad: z.number().int().positive({
          message: "La cantidad debe ser un número entero positivo",
        }),
      })
    )
    .nonempty({ message: "Debe incluir al menos un producto" }),
  direccionEntrega: z
    .string()
    .min(10, { message: "La dirección debe tener al menos 10 caracteres" })
    .max(200, { message: "La dirección no puede exceder 200 caracteres" })
    .trim(),
  estado: z
    .enum(["pendiente", "confirmado", "rechazado"])
    .default("pendiente")
    .optional(),
});

// Definir el esquema de validación para el estado
export const updateOrderStatusSchema = z.object({
  estado: z.enum(["pendiente", "confirmado", "rechazado"], {
    message: "El estado debe ser 'pendiente', 'confirmado' o 'rechazado'",
  }),
});
