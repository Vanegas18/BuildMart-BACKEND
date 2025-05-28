import { z } from "zod";

// Validación para los productos
const productSchema = z.object({
  producto: z.string().min(1, { message: "El producto es obligatorio" }), // ID del producto
  cantidad: z.number().min(1, { message: "La cantidad debe ser al menos 1" }), // Cantidad debe ser positiva
});

// Esquema de validación para la venta (creación manual - casos excepcionales)
export const saleSchema = z.object({
  clienteId: z
    .string()
    .min(24, { message: "El clienteId debe ser un ObjectId válido" }),
  productos: z
    .array(productSchema)
    .nonempty({ message: "Debe proporcionar al menos un producto" }),
});

// Esquema de validación para actualizar el estado de una venta
export const updateSaleStatusSchema = z.object({
  estado: z.enum(
    ["procesando", "enviado", "entregado", "completado", "reembolsado"],
    {
      message:
        "El estado debe ser 'procesando', 'enviado', 'entregado', 'completado' o 'reembolsado'",
    }
  ),
});
