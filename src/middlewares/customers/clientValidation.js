import { z } from 'zod';

// Validación para la creación de un cliente
export const clientSchema = z.object({
  nombre: z
    .string()
    .trim()
    .nonempty({ message: "El nombre es obligatorio" }),

  correo: z
    .string()
    .email({ message: "Debe ser un correo válido" })
    .nonempty({ message: "El correo es obligatorio" }),

  telefono: z
    .string()
    .nonempty({ message: "El teléfono es obligatorio" })
    .regex(/^[0-9+\s()-]{8,15}$/, {
      message: "El teléfono debe tener un formato válido",
    }),

  direccion: z
    .string()
    .trim()
    .nonempty({ message: "La dirección es obligatoria" }),

  departamento: z
    .string()
    .trim()
    .nonempty({ message: "El departamento es obligatorio" }),

  ciudad: z
    .string()
    .trim()
    .nonempty({ message: "La ciudad es obligatoria" }),

  estado: z.enum(["activo", "inactivo"]).default("activo").optional(),
});

// Esquema de validación para actualizar el cliente (campo parcial)
export const updateClientSchema = clientSchema.partial();
