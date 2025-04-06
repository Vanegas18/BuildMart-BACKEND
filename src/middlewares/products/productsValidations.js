import { z } from "zod";

const objectIdRegex = /^[a-fA-F0-9]{24}$/; // Patrón para validar MongoDB ObjectId

export const ProductSchema = z.object({
  nombre: z
    .string()
    .min(5, { message: "El nombre debe tener al menos 5 caracteres" })
    .trim(),
  descripcion: z
    .string()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" }),
  categoriaId: z
    .string()
    .regex(objectIdRegex, { message: "El ID de la categoría no es válido" }),
  precioCompra: z.number().min(0, "El precio no puede ser negativo"),
  stock: z
    .number()
    .min(1, { message: "El stock debe ser mayor o igual a 1" })
    .optional(),
  img: z.string().optional(),
  imgType: z.enum(["url", "file"]).default("url"),
  estado: z.enum(["Disponible", "No disponible"]).optional(),
});

export const updateProductSchema = ProductSchema.partial();
