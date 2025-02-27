import { body } from 'express-validator';

// Validaciones para la creación de un pedido
export const validateOrder = [
    body('productos').isArray().withMessage('Los productos deben ser un arreglo'),
];

// Validaciones para actualizar el estado de un pedido
export const validateOrderStatus = [
    body('status').isIn(['pendiente', 'pagado', 'cancelado']).withMessage('El estado debe ser "pendiente", "pagado" o "cancelado"')
];
