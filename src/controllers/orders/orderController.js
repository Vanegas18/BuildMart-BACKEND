import { validationResult } from 'express-validator';
import Order from '../../models/orders/orderModel.js';
import Product from '../../models/products/productModel.js';


export const createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { clientId, productos } = req.body;
    try {
        // Calcular el total del pedido
        let total = 0;
        for (const producto of productos) {
            const productoData = await Product.findById(producto.productoId); // Usamos el modelo Productos
            if (!productoData) {
                return res.status(404).json({ message: `Producto con ID ${producto.productoId} no encontrado` });
            }
            total += productoData.precio * producto.quantity; // Calculamos el total con el precio y la cantidad
        }

        // Crear el nuevo pedido con la lista de productos y el total calculado
        const newOrder = new Order({
            clientId,
            productos,
            total
        });

        await newOrder.save();
        res.status(201).json(newOrder); // Respondemos con el pedido creado
    } catch (error) {
        console.error(error.message);
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
        const order = await Order.findById(id).populate('productos.productoId');
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Si el estado es "cancelado" y el pedido no estaba ya cancelado, no se puede cambiar a otro estado
        if (order.status === 'cancelado') {
            return res.status(400).json({ message: 'El pedido ya está cancelado y no puede ser modificado.' });
        }

        // Si el estado es "pagado", descontamos el stock si no estaba pagado antes
        if (status === 'pagado' && order.status !== 'pagado') {
            // Descontamos el stock de los productos
            for (const producto of order.productos) {
                const productData = await Product.findById(producto.productoId);
                if (!productData) {
                    return res.status(404).json({ message: `Producto con ID ${producto.productoId} no encontrado` });
                }

                // Verificamos que haya suficiente stock
                if (productData.stock < producto.quantity) {
                    return res.status(400).json({ message: `No hay suficiente stock para el producto ${productData.nombre}` });
                }

                // Descontamos el stock
                productData.stock -= producto.quantity;
                await productData.save();
            }
        }

        // Si el estado es "pagado", ya no se puede cambiar el estado
        if (status === 'pagado' && order.status === 'pagado') {
            return res.status(400).json({ message: 'El estado ya es "pagado", no se puede modificar.' });
        }

        // Si el estado cambia a "cancelado", no se puede cambiar más
        if (status === 'cancelado') {
            order.status = 'cancelado';
        } else if (status !== 'cancelado' && status !== 'pagado') {
            // Aquí puedes agregar validaciones adicionales de estados si es necesario
            return res.status(400).json({ message: 'Estado no válido o no permitido.' });
        }

        // Si el estado no es "pagado" ni "cancelado", simplemente se actualiza
        if (status !== 'cancelado' && status !== 'pagado') {
            order.status = status;
        }

        // Guardar el pedido con el nuevo estado
        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error al actualizar el estado del pedido, intente nuevamente.' });
    }
};
