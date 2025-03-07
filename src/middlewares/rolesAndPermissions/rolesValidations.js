import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const rolesSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(5, { message: "El nombre debe tener al menos 5 caracteres" })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "El nombre solo puede contener letras",
    }),
  descripcion: z
    .string()
    .trim()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" })
    .optional(),
  permisos: z
    .array(
      z.string().refine(isValidObjectId, {
        message: "Cada permiso debe ser un ObjectId válido",
      })
    )
    .min(1, { message: "Debe haber al menos un permiso" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateRolesSchema = rolesSchema.partial();
