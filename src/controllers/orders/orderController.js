import { validationResult } from 'express-validator';
import Order from '../../models/orders/orderModel.js';

export const createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { products, total } = req.body;

    try {
        const newOrder = new Order({
            products,
            total,
            status: 'pendiente'
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        console.error(error.message); // Para debug
        res.status(500).json({ message: 'Error al crear el pedido, intente nuevamente.' });
    }
};

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        console.error(error.message); // Para debug
        res.status(500).json({ message: 'Error al obtener los pedidos, intente nuevamente.' });
    }
};

export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        order.status = status;
        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error(error.message); // Para debug
        res.status(500).json({ message: 'Error al actualizar el estado del pedido, intente nuevamente.' });
    }
};
