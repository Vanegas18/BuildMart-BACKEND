import { z } from "zod";

export const supplierSchema = z.object({
  nombre: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .trim()
    .nonempty({ message: "El nombre es obligatorio" }),
  direccion: z
    .string()
    .min(5, { message: "La dirección debe tener al menos 5 caracteres" })
    .trim()
    .nonempty({ message: "La dirección es obligatoria" }),
  telefono: z
    .string()
    .min(10, {
      message: "El número de teléfono debe tener al menos 10 caracteres",
    })
    .trim()
    .nonempty({ message: "El número de teléfono es obligatorio" }),
  correo: z
    .string()
    .email({ message: "Debe ser un correo electrónico válido" })
    .nonempty({ message: "El correo es obligatorio" }),
  categoriaProveedorId: z
    .string()
    .nonempty({ message: "El ID de la categoría del proveedor es obligatorio" })
    .regex(/^[a-fA-F0-9]{24}$/, {
      message: "El ID de la categoría debe ser un ObjectId válido",
    }),
});

export const updateSupplierSchema = z.object({
  nombre: z.string().min(3).trim().optional(),
  direccion: z.string().min(5).trim().optional(),
  telefono: z.string().min(10).trim().optional(),
  correo: z.string().email().optional(),
  categoriaProveedorId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, {
      message: "El ID de la categoría debe ser un ObjectId válido",
    })
    .optional(),
});
