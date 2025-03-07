// Validaciones para la creación de un cliente
import { body } from "express-validator";

export const validateClient = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("correo").isEmail().withMessage("Debe ser un correo válido"),
  body("telefono").isMobilePhone().withMessage("El teléfono debe ser válido"),
  body("direccion").notEmpty().withMessage("La dirección es obligatoria"),
  body("departamento").notEmpty().withMessage("El departamento es obligatorio"),
  body("ciudad").notEmpty().withMessage("La ciudad es obligatoria"),
];

// import { z } from "zod";

// export const clientSchema = z.object({
//   nombre: z.string().trim().nonempty({ message: "El nombre es obligatorio" }),

//   correo: z
//     .string()
//     .trim()
//     .email({ message: "Debe ser un correo válido" })
//     .nonempty({ message: "El correo es obligatorio" }),

//   telefono: z
//     .string()
//     .trim()
//     .nonempty({ message: "El teléfono es obligatorio" })
//     .regex(/^[0-9+\s()-]{8,15}$/, {
//       message: "El teléfono debe tener un formato válido",
//     }),

//   direccion: z
//     .string()
//     .trim()
//     .nonempty({ message: "La dirección es obligatoria" }),

//   departamento: z
//     .string()
//     .trim()
//     .nonempty({ message: "El departamento es obligatorio" }),

//   ciudad: z.string().trim().nonempty({ message: "La ciudad es obligatoria" }),

//   estado: z.enum(["activo", "inactivo"]).default("activo").optional(),
// });

// export const updateClientSchema = clientSchema.partial();
