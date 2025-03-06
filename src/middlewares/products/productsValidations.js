import { z } from "zod";

const objectIdRegex = /^[a-fA-F0-9]{24}$/; // Patrón para validar MongoDB ObjectId

export const ProductSchema = z.object({
  nombre: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  descripcion: z
    .string()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" }),
  categoriaId: z
    .string()
    .regex(objectIdRegex, { message: "El ID de la categoría no es válido" }),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  stock: z
    .number()
    .min(10, { message: "El stock debe ser mayor o igual a 10" })
    .optional(),
  img: z.string().url("Debe ser una URL válida").optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateProductSchema = z.object({
  nombre: z.string().min(3).optional(),
  descripcion: z.string().min(3).optional(),
  categoriaId: z
    .string()
    .regex(objectIdRegex, { message: "El ID de la categoría no es válido" })
    .optional(),
  precio: z.number().min(0).optional(),
  stock: z.number().min(10).optional(),
  img: z.string().url().optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});
