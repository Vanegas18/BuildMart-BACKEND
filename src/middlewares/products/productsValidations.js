import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectIdRegex = /^[a-fA-F0-9]{24}$/; // Patrón para validar MongoDB ObjectId

// Esquema para validar ofertas
export const OfertaSchema = z
  .object({
    activa: z.boolean().default(false),
    descuento: z
      .number()
      .min(0, { message: "El descuento no puede ser negativo" })
      .max(100, { message: "El descuento no puede ser mayor a 100%" })
      .default(0),
    precioOferta: z
      .number()
      .min(0, { message: "El precio de oferta no puede ser negativo" })
      .default(0),
    fechaInicio: z
      .string()
      .datetime({ message: "La fecha de inicio debe ser válida" })
      .nullable()
      .optional(),
    fechaFin: z
      .string()
      .datetime({ message: "La fecha de fin debe ser válida" })
      .nullable()
      .optional(),
    descripcionOferta: z
      .string()
      .max(200, { message: "La descripción no puede exceder 200 caracteres" })
      .optional(),
  })
  .refine(
    (data) => {
      // Si está activa, debe tener descuento o precio de oferta
      if (data.activa && data.descuento === 0 && data.precioOferta === 0) {
        return false;
      }
      // Si hay fechas, la fecha de fin debe ser posterior a la de inicio
      if (data.fechaInicio && data.fechaFin) {
        return new Date(data.fechaFin) > new Date(data.fechaInicio);
      }
      return true;
    },
    {
      message:
        "Debe especificar descuento o precio de oferta cuando la oferta esté activa, y la fecha fin debe ser posterior a la de inicio",
    }
  );

// Esquema específico para activar/desactivar ofertas
export const OfertaUpdateSchema = z.object({
  oferta: OfertaSchema,
});

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
  precioCompra: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z
      .number()
      .min(0, { message: "El precio de compra no puede ser negativo" })
      .refine((val) => val >= 0, {
        message: "El precio de compra debe ser mayor a 0",
      })
  ),
  precio: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z
      .number()
      .min(0, { message: "El precio de venta no puede ser negativo" })
      .refine((val) => val >= 0, {
        message: "El precio de venta debe ser mayor a 0",
      })
  ),
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
  oferta: OfertaSchema.optional(),
});

export const updateProductSchema = ProductSchema.partial();

export const estadoProductSchema = z.object({
  nuevoEstado: z.enum(["Activo", "Descontinuado", "Agotado", "En oferta"]),
});
