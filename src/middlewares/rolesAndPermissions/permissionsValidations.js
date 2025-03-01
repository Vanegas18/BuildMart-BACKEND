import { z } from "zod";

export const permissionsSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  descripcion: z
    .string()
    .trim()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updatePermissionsSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .optional(),
  descripcion: z
    .string()
    .trim()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" })
    .optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});
