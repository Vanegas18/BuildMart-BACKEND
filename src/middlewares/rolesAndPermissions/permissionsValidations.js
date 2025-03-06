import { z } from "zod";

export const permissionsSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(5, { message: "El nombre debe tener al menos 5 caracteres" }),
  descripcion: z
    .string()
    .trim()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" })
    .optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updatePermissionsSchema = z.object({
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
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});
