import { z } from "zod";

export const UserSchema = z.object({
  nombre: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  correo: z.string().min(10, {
    message:
      "El correo debe tener al menos 10 caracteres y cumplir con los estándares de correos electrónicos",
  }),
  telefono: z
    .number()
    .min(10, { message: "El telefono debe tener al menos 10 caracteres" }),
  direccion: z
    .string()
    .min(15, { message: "La dirección debe tener al menos 15 caracteres" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateUserSchema = z.object({
  nombre: z.string().min(3).optional(),
  correo: z.string().min(10).optional(),
  telefono: z.number().min(10).optional(),
  direccion: z.string().min(15).optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});
