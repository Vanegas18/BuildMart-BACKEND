import express from 'express';
import { validateOrder, validateOrderStatus } from '../../middlewares/orders/orderValidation.js'; // Importamos el middleware de validaciones
import { createOrder, getOrders, updateOrderStatus } from '../../controllers/orders/orderController.js';

const router = express.Router();

// Usamos las validaciones antes de ejecutar el controlador
router.post('/', validateOrder, createOrder);
router.get('/:id?', getOrders);
router.put('/:id', validateOrderStatus, updateOrderStatus);

export default router;
