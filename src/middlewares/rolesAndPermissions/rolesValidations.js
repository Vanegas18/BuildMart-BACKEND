import { z } from "zod";

export const rolesSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  descripcion: z
    .string()
    .trim()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" })
    .optional(),
  permisos: z
    .array(z.string())
    .min(1, { message: "Debe haber al menos un permiso" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateRolesSchema = z.object({
  nombre: z.string().trim().min(3).optional(),
  descripcion: z.string().trim().min(3).optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});
