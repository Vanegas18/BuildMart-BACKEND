import { validationResult } from 'express-validator';
import Sale from '../../models/sales/saleModel.js';

export const createSale = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { clientId, products, total } = req.body;

    try {
        const newSale = new Sale({
            clientId,
            products,
            total,
            date: new Date()
        });

        await newSale.save();
        res.status(201).json(newSale);
    } catch (error) {
        console.error(error.message); 
        res.status(500).json({ message: 'Error al registrar la venta, intente nuevamente.' });
    }
};

export const getSales = async (req, res) => {
    try {
        const sales = await Sale.find().populate('clientId'); 
        res.status(200).json(sales);
    } catch (error) {
        console.error(error.message); 
        res.status(500).json({ message: 'Error al obtener las ventas, intente nuevamente.' });
    }
};
