import express from 'express';
import { createSale, getSales } from '../../controllers/sales/saleController.js';

const router = express.Router();

// Ruta para obtener las ventas
router.get('/:id?', getSales);

// Ruta para crear una nueva venta
router.post('/', createSale);

export default router;
