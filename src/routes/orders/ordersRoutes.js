import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../../controllers/orders/orderController.js';

const router = express.Router();

// Ruta para crear una orden
router.post('/', createOrder);

// Ruta para obtener órdenes (con o sin ID)
router.get('/:id?', getOrders);

// Ruta para actualizar el estado de una orden
router.put('/:id', updateOrderStatus);

export default router;
