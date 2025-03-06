import express from 'express';
import { createSale, getSales } from '../../controllers/sales/saleController.js';

const router = express.Router();

router.post('/', createSale);
router.get('/:id?', getSales);

export default router;
