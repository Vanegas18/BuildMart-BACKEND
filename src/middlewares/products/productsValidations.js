import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectIdRegex = /^[a-fA-F0-9]{24}$/; // Patrón para validar MongoDB ObjectId

export const ProductSchema = z.object({
  nombre: z
    .string()
    .min(5, { message: "El nombre debe tener al menos 5 caracteres" })
    .trim(),
  descripcion: z
    .string()
    .min(5, { message: "La descripción debe tener al menos 5 caracteres" }),
  categorias: z
    .array(
      z.string().refine(isValidObjectId, {
        message: "El ID de la categoría no es válido",
      })
    )
    .min(1, { message: "Debe haber al menos una categoría" }),
  precioCompra: z.number().min(0, "El precio no puede ser negativo"),
  stock: z
    .number()
    .min(1, { message: "El stock debe ser mayor o igual a 1" })
    .optional(),
  img: z.string().optional(),
  imgType: z.enum(["url", "file"]).default("url"),
  estado: z
    .enum(["Activo", "Descontinuado", "Agotado", "En oferta"])
    .optional(),
});

export const updateProductSchema = ProductSchema.partial();

export const estadoProductSchema = z.object({
  nuevoEstado: z.enum(["Activo", "Descontinuado", "Agotado", "En oferta"]),
});


