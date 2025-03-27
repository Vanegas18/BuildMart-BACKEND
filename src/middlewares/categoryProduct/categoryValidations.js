import { z } from "zod";

export const categorySchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(5, { message: "El nombre debe tener al menos 5 caracteres" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
      message: "El nombre solo puede contener letras y espacios",
    }),
  descripcion: z
    .string()
    .trim()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" }),
  estado: z.enum(["Activa", "Inactiva"]).optional(),
});

export const updateCategorySchema = categorySchema.partial();
