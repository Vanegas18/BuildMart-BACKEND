import { z } from "zod";

export const categorySchema = z.object({
  nombre: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  descripcion: z
    .string()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateCategorySchema = categorySchema.partial();
