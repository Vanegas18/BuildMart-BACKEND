import { z } from "zod";

export const permissionsSchema = z.object({
  nombreGrupo: z
    .string()
    .trim()
    .min(5, { message: "El nombre del grupo debe tener al menos 5 caracteres" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/u, {
      message: "Nombre solo puede contener letras",
    }),
  permisos: z.array(
    z.object({
      label: z
        .string()
        .trim()
        .min(3, { message: "La etiqueta debe tener al menos 3 caracteres" }),
      description: z.string().trim().optional(),
      estado: z.enum(["Activo", "Inactivo"]).optional(),
    })
  ),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updatePermissionsSchema = permissionsSchema.partial();
