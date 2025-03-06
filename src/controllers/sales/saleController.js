import { validationResult } from 'express-validator';
import Sale from '../../models/sales/saleModel.js';
import Product from '../../models/products/productModel.js';
import Client from '../../models/customers/clientModel.js';
import mongoose from 'mongoose';

export const getSales = async (req, res) => {
    try {
        const { id } = req.params;

        // Si hay un id en los parámetros, buscamos una venta específica
        if (id) {
            // Verificar si el id es un ObjectId válido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'ID de venta no válido.' });
            }

            const sale = await Sale.findById(id).populate('saleId'); // Buscamos la venta por su id y poblamos la relación con el cliente

            if (!sale) {
                return res.status(404).json({ message: 'Venta no encontrada.' }); // Si no se encuentra la venta
            }

            return res.status(200).json(sale); // Si se encuentra la venta
        }

        // Si no hay id, obtenemos todas las ventas
        const sales = await Sale.find().populate('saleId'); // Traemos todas las ventas y poblamos los clientes

        res.status(200).json(sales); // Devolvemos todas las ventas
    } catch (error) {
        console.error(error.message); // Para debug
        res.status(500).json({ message: 'Error al obtener las ventas, intente nuevamente.' });
    }
};


export const createSale = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { clientId, productos } = req.body;

    // Verificamos si productos es un array y tiene al menos un elemento
    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un producto en la venta.' });
    }

    try {
        // Verificar si el clientId es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            return res.status(400).json({ message: 'El clientId proporcionado no es válido.' });
        }

        // Verificar si el cliente existe
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        let total = 0;
        
        // Recorrer los productos, verificar stock y calcular el total
        for (const producto of productos) {
            const productData = await Product.findById(producto.productId);
            if (!productData) {
                return res.status(404).json({ message: `Producto con ID ${producto.productId} no encontrado.` });
            }

            // Verificamos que haya suficiente stock
            if (productData.stock < producto.quantity) {
                return res.status(400).json({ message: `No hay suficiente stock para el producto ${productData.nombre}.` });
            }

            // Calculamos el total de la venta
            total += productData.precio * producto.quantity;

            // Descontamos el stock de cada producto
            productData.stock -= producto.quantity;
            await productData.save();
        }

        // Generar un saleId único (asegurándonos de que no se repita)
        const lastSale = await Sale.findOne().sort({ saleId: -1 }).limit(1);
        const newSaleId = lastSale ? lastSale.saleId + 1 : 1; // Si no hay ventas previas, empieza desde 1

        // Crear la venta
        const newSale = new Sale({
            clientId,
            productos,
            total
        });

        await newSale.save();

        res.status(201).json({
            message: 'Venta creada exitosamente.',
            sale: newSale
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error al crear la venta, intente nuevamente.' });
    }
};
