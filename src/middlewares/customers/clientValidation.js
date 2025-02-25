// Validaciones para la creación de un cliente
import { body } from 'express-validator';

export const validateClient = [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Debe ser un correo válido'),
    body('phone').isMobilePhone().withMessage('El teléfono debe ser válido'),
    body('address').notEmpty().withMessage('La dirección es obligatoria'),
    body('department').notEmpty().withMessage('El departamento es obligatorio'),
    body('city').notEmpty().withMessage('La ciudad es obligatoria'),
    body('status').isIn(['activo', 'inactivo']).withMessage('El estado debe ser "activo" o "inactivo"')
];