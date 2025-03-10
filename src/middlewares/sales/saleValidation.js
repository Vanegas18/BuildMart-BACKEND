import { z } from "zod";

// Validación para los productos
const productSchema = z.object({
  producto: z.string().min(1, { message: "El producto es obligatorio" }), // ID del producto
  cantidad: z.number().min(1, { message: "La cantidad debe ser al menos 1" }), // Cantidad debe ser positiva
});

// Esquema de validación para la venta
export const saleSchema = z.object({
  clienteId: z.string().min(24, { message: "El clienteId debe ser un ObjectId válido" }), // Verifica que el clienteId sea un ObjectId válido
  productos: z.array(productSchema).nonempty({ message: "Debe proporcionar al menos un producto" }), // Verifica que haya al menos un producto
});
