import express from 'express';
import { validateClient } from '../../middlewares/customers/clientValidation.js'; // Importamos el middleware de validaciones
import { createClient, getClients, updateClient } from '../../controllers/customers/clientController.js';

const router = express.Router();

// Usamos las validaciones antes de ejecutar el controlador
router.post('/', validateClient, createClient);
router.put('/:id', validateClient, updateClient);
router.get('/:id?', getClients); 

export default router;