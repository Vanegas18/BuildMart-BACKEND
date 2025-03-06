import { z } from "zod";

export const categorySchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(5, { message: "El nombre debe tener al menos 5 caracteres" }),
  descripcion: z
    .string()
    .trim()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateCategorySchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(5, { message: "El nombre debe tener al menos 5 caracteres" })
    .optional(),
  descripcion: z
    .string()
    .trim()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" })
    .optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(), // Para actualización también
});
