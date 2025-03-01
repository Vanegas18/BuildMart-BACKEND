import { z } from "zod";

export const UserSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(10, { message: "El nombre debe tener al menos 10 caracteres" }),
  correo: z.string().trim().email({ message: "El correo es invalido" }),
  contraseña: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .regex(/[A-Z]/, {
      message: "La contraseña debe incluir al menos una letra mayúscula",
    })
    .regex(/[0-9]/, {
      message: "La contraseña debe incluir al menos un número",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: "La contraseña debe incluir al menos un carácter especial",
    }),
  telefono: z.string().regex(/^\d{7,15}$/, {
    message: "El teléfono debe contener entre 7 y 15 dígitos numéricos",
  }),
  direccion: z
    .string()
    .min(15, { message: "La dirección debe tener al menos 15 caracteres" }),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateUserSchema = UserSchema.partial();
