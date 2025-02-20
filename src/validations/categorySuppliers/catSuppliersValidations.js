import { z } from "zod";

export const categoriaSchema = z.object({
  name: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  descripcion: z
    .string()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateCategoriaSchema = z.object({
  name: z.string().min(3).optional(),
  descripcion: z.string().min(3).optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(), // Para la actualización
});
