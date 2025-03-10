import { validationResult } from 'express-validator';
import Clients from '../../models/customers/clientModel.js'; // Importamos el modelo de Clientes
import mongoose from 'mongoose'; // Para validar ObjectId si es necesario

// Obtener todos los clientes o un cliente específico
export const getClients = async (req, res) => {
    try {
        const { id } = req.params;

        // Si hay un id en los parámetros, buscamos un cliente específico
        if (id) {
            // Verificar si el id es un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'ID de cliente no válido.' });
            }

            const client = await Clients.findById(id); // Buscamos el cliente por su id

            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado.' }); // Si no se encuentra el cliente
            }

            return res.status(200).json(client); // Devolvemos el cliente encontrado
        }

        // Si no hay id, obtenemos todos los clientes
        const clients = await Clients.find();
        res.status(200).json(clients); // Devolvemos todos los clientes
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error al obtener los clientes, intente nuevamente.' });
    }
};

// Crear un nuevo cliente
export const createClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, correo, telefono, direccion, departamento, ciudad, estado } = req.body;

    try {
        // Verificar si el correo ya está registrado
        const existingClient = await Clients.findOne({ correo });
        if (existingClient) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Crear el nuevo cliente
        const newClient = new Clients({
            nombre,
            correo,
            telefono,
            direccion,
            departamento,
            ciudad,
            estado
        });

        await newClient.save();
        res.status(201).json({ message: 'Cliente creado exitosamente.', client: newClient });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error al crear el cliente, intente nuevamente.' });
    }
};

// Actualizar un cliente existente
export const updateClient = async (req, res) => {
    const { id } = req.params;  // ID del cliente a actualizar
    const { nombre, correo, telefono, direccion, departamento, ciudad, estado } = req.body;

    // Verificar si hay errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Buscar el cliente por ID
        const client = await Clients.findById(id);
        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        // Actualizar los datos del cliente
        client.nombre = nombre || client.nombre;
        client.correo = correo || client.correo;
        client.telefono = telefono || client.telefono;
        client.direccion = direccion || client.direccion;
        client.departamento = departamento || client.departamento;
        client.ciudad = ciudad || client.ciudad;
        client.estado = estado || client.estado;

        // Guardar los cambios
        await client.save();

        // Responder con el cliente actualizado
        res.status(200).json({ message: 'Cliente actualizado exitosamente.', client });
    } catch (error) {
        console.error(error.message);  // Para debug
        res.status(500).json({ message: 'Error al actualizar el cliente, intente nuevamente.' });
    }
};