import { body } from 'express-validator';

// Validaciones para la creación de un pedido
export const validateOrder = [
    body('productos').isArray().withMessage('Los productos deben ser un arreglo'),
];

// Validaciones para actualizar el estado de un pedido
export const validateOrderStatus = [
    body('estado').isIn(['pendiente', 'pagado', 'cancelado']).withMessage('El estado debe ser "pendiente", "pagado" o "cancelado"')
];


// import { z } from "zod";

// export const orderSchema = z.object({
//   fecha: z
//     .date()
//     .default(() => new Date())
//     .optional(),

//   clienteId: z
//     .string()
//     .nonempty({ message: "El ID del cliente es obligatorio" })
//     .regex(/^[0-9a-fA-F]{24}$/, {
//       message: "El ID del cliente debe ser un ObjectId válido",
//     }),

//   productos: z
//     .array(
//       z.object({
//         productoId: z
//           .string()
//           .nonempty({ message: "El ID del producto es obligatorio" })
//           .regex(/^[0-9a-fA-F]{24}$/, {
//             message: "El ID del producto debe ser un ObjectId válido",
//           }),
//         cantidad: z.number().int().positive({
//           message: "La cantidad debe ser un número entero positivo",
//         }),
//       })
//     )
//     .nonempty({ message: "Debe incluir al menos un producto" }),

//   total: z
//     .number()
//     .positive({ message: "El total debe ser un número positivo" }),

//   estado: z
//     .enum(["pendiente", "pagado", "cancelado"])
//     .default("pendiente")
//     .optional(),
// });

// export const updateOrderStatusSchema = z.object({
//   estado: z
//     .enum(["pendiente", "pagado", "cancelado"], {
//       message: "El estado debe ser 'pendiente', 'pagado' o 'cancelado'",
//     })
//     .nonempty({ message: "El estado es obligatorio" }),
// });

// export const updateOrderSchema = orderSchema.partial();
