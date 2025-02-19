import { z } from "zod";

export const ProductSchema = z.object({
  nombre: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  descripcion: z
    .string()
    .min(3, { message: "La descripción debe tener al menos 3 caracteres" }),
  categoriaId: z.string().min(3, "La categoría es requerida"),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  stock: z.number().min(0).optional(),
  img: z.string().url("Debe ser una URL válida"),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const updateProductSchema = z.object({
  nombre: z.string().min(3).optional(),
  descripcion: z.string().min(3).optional(),
  categoriaId: z.string().min(3).optional(),
  precio: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  img: z.string().url().optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});
