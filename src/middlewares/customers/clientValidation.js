import { z } from "zod";

// Validación para la creación de un cliente
export const clientSchema = z.object({
  cedula: z.string().regex(/^\d{7,15}$/, {
    message: "La cedula debe contener entre 7 y 15 dígitos numéricos",
  }),
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
  departamento: z
    .string()
    .trim()
    .min(4, { message: "El departamento debe tener al menos 4 caracteres" })
    .regex(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/, {
      message: "El departamento solo debe contener letras",
    }),
  ciudad: z
    .string()
    .trim()
    .min(4, { message: "La ciudad debe tener al menos 4 caracteres" })
    .regex(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/, {
      message: "La ciudad solo debe contener letras",
    }),

  estado: z.enum(["Activo", "Inactivo"]).default("Activo").optional(),
});

// Esquema de validación para actualizar el cliente (campo parcial)
export const updateClientSchema = clientSchema.partial();
