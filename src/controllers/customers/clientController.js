import { validationResult } from 'express-validator';
import Client from '../../models/customers/clientModel.js';

export const getClients = async (req, res) => {
    try {
        // Verificamos si existe un ID en los parámetros de la URL
        const { id } = req.params;

        // Si hay un ID, buscamos el cliente por su ID
        if (id) {
            const client = await Client.findById(id);
            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }
            return res.status(200).json(client);
        }

        // Si no hay un ID, devolvemos todos los clientes
        const clients = await Client.find();
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, address, department, city } = req.body;

    try {
        const newClient = new Client({
            name,
            email,
            phone,
            address,
            department,
            city
        });

        await newClient.save();
        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateClient = async (req, res) => {
    const { id } = req.params;  // ID del cliente a actualizar
    const { name, email, phone, address, department, city, status } = req.body;

    // Verifica si hay errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Buscar el cliente por ID
        const client = await Client.findById(id);
        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        // Actualizar los datos del cliente
        client.name = name || client.name;
        client.email = email || client.email;
        client.phone = phone || client.phone;
        client.address = address || client.address;
        client.department = department || client.department;
        client.city = city || client.city;
        client.status = status || client.status;

        // Guardar los cambios
        await client.save();

        // Responder con el cliente actualizado
        res.status(200).json(client);
    } catch (error) {
        console.error(error.message);  // Para debug
        res.status(500).json({ message: 'Error al actualizar el cliente, intente nuevamente.' });
    }
};
