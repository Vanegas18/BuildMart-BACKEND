import express from 'express';
import { 
    createOrder, 
    getOrders, 
    updateOrderStatus 
} from '../../controllers/orders/orderController.js';
import { verificarAdmin } from "../../middlewares/auth/configAuth.js";

const router = express.Router();

// Ruta para obtener órdenes (con o sin ID)
router.get('/:id?', getOrders);

// Ruta para crear una orden
router.post('/', createOrder);

// Ruta para actualizar el estado de una orden
router.put('/:id',verificarAdmin, updateOrderStatus);

export default router;
