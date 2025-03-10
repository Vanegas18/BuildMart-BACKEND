import express from 'express';
import { createClient, getClients, updateClient } from '../../controllers/customers/clientController.js';

const router = express.Router();

// Ruta para obtener clientes (con o sin ID)
router.get('/:id?', getClients);

// Ruta para crear un cliente
router.post('/', createClient);

// Ruta para actualizar un cliente
router.put('/:id', updateClient);

export default router;
