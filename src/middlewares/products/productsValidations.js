import { z } from "zod";
import { isValidObjectId } from "mongoose";

const objectIdRegex = /^[a-fA-F0-9]{24}$/; // Patrón para validar MongoDB ObjectId

// Esquema para validar ofertas
export const OfertaSchema = z
  .object({
    activa: z.boolean().default(false),
    descuento: z.coerce
      .number()
      .min(0, "El descuento no puede ser negativo")
      .max(99, "El descuento no puede ser mayor a 99%")
      .default(0),
    precioOferta: z.coerce
      .number()
      .min(0, "El precio de oferta no puede ser negativo")
      .default(0),
    fechaInicio: z
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (!val || val === "") return null;
        // DEVUELVE: "2025-05-25T20:56:00-05:00"
        return val.endsWith(":00") ? `${val}-05:00` : `${val}:00-05:00`;
      }),
    fechaFin: z
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (!val) return null;
        // Aquí devolvemos "2025-05-25T20:39" + ":00" opcional si quieres segundos
        return val.endsWith(":00") ? `${val}-05:00` : `${val}:00-05:00`;
      }),
    descripcionOferta: z
      .string()
      .max(200, "La descripción no puede exceder 200 caracteres")
      .optional()
      .default(""),
  })
  .refine(
    (data) => {
      if (data.activa && data.descuento === 0 && data.precioOferta === 0) {
        return false;
      }

      if (data.fechaInicio && data.fechaFin) {
        const fechaInicio = new Date(data.fechaInicio);
        const fechaFin = new Date(data.fechaFin);
        return fechaFin > fechaInicio;
      }

      return true;
    },
    {
      message:
        "Debe especificar descuento o precio de oferta cuando la oferta esté activa, y la fecha fin debe ser posterior a la de inicio",
      path: ["fechaFin"],
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
