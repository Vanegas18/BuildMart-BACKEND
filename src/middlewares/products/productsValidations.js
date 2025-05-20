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
  // precioCompra: z.preprocess(
  //   (val) => (val === undefined ? undefined : Number(val)),
  //   z
  //     .number()
  //     .min(0, { message: "El precio de compra no puede ser negativo" })
  //     .refine((val) => val > 0, {
  //       message: "El precio de compra debe ser mayor a 0",
  //     })
  // ),
  // precio: z.preprocess(
  //   (val) => (val === undefined ? undefined : Number(val)),
  //   z
  //     .number()
  //     .min(0, { message: "El precio de venta no puede ser negativo" })
  //     .refine((val) => val > 0, {
  //       message: "El precio de venta debe ser mayor a 0",
  //     })
  // ),
  stock: z
    .preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z
        .number()
        .min(0, { message: "El stock no puede ser negativo" })
        .refine((val) => val >= 0, {
          message: "El stock debe ser mayor o igual a 0",
        })
    )
    .default(0),

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
