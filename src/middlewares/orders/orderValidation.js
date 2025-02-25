import { body } from 'express-validator';

// Validaciones para la creación de un pedido
export const validateOrder = [
    body('products').isArray().withMessage('Los productos deben ser un arreglo'),
    body('total').isNumeric().withMessage('El total debe ser un número'),
];

// Validaciones para actualizar el estado de un pedido
export const validateOrderStatus = [
    body('status').isIn(['pendiente', 'pagado', 'cancelado']).withMessage('El estado debe ser "pendiente", "pagado" o "cancelado"')
];
