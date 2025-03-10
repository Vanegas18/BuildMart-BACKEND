import { z } from "zod";

export const categorySchema = z.object({
  nombre: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .nonempty({ message: "El nombre es obligatorio" }),
  descripcion: z
    .string()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" })
    .nonempty({ message: "La descripción es obligatoria" }),
    estado: z
    .enum(["Activo", "Inactivo"], {
      message: "El estado solo puede ser 'Activo' o 'Inactivo'",
    })
    .optional(),
});

export const updateCategorySchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }).optional(),
  descripcion: z.string().min(3, { message: "La descripción debe tener al menos 3 caracteres" }).optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});
