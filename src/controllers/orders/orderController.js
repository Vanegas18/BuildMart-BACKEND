import { validationResult } from 'express-validator';
import Order from '../../models/orders/orderModel.js';
import Product from '../../models/products/productModel.js';
import Client from '../../models/customers/clientModel.js';
import mongoose from 'mongoose'; // Asegúrate de importar mongoose


//Metodo GET
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        console.error(error.message); // Para debug
        res.status(500).json({ message: 'Error al obtener los pedidos, intente nuevamente.' });
    }
};

//Metodo POST

export const createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { clientId, productos } = req.body;
    try {
        // Verificar si el clientId es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            return res.status(400).json({ message: 'El clientId proporcionado no es válido.' });
        }

        // Verificar si el cliente existe y su estado
        const client = await Client.findOne({ _id: clientId });  // Usar _id para la búsqueda si clientId es ObjectId
        if (!client) {
            return res.status(404).json({ message: `Cliente con ID ${clientId} no encontrado` });
        }
        if (client.status === 'inactivo') {
            return res.status(400).json({ message: 'No se puede crear la orden, el cliente está inactivo.' });
        }

        // Verificar si la cantidad de productos solicitados es mayor que el stock disponible
        for (const producto of productos) {
            const productoData = await Product.findById(producto.productoId); // Usamos el modelo Productos
            if (!productoData) {
                return res.status(404).json({ message: `Producto con ID ${producto.productoId} no encontrado` });
            }
            if (producto.quantity > productoData.stock) {
                return res.status(400).json({ message: `El producto ${productoData.nombre} solo tiene ${productoData.stock} unidades en stock, no puedes pedir ${producto.quantity}.` });
            }
        }

        // Calcular el total del pedido
        let total = 0;
        for (const producto of productos) {
            const productoData = await Product.findById(producto.productoId); // Usamos el modelo Productos
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


//Metodo PUT
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Buscar la orden y sus productos asociados
        const order = await Order.findById(id).populate('productos.productoId');
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Si el estado de la orden ya es "pagado", no se puede cancelar
        if (order.status === 'pagado' && status === 'cancelado') {
            return res.status(400).json({ message: 'La orden ya está pagada, no se puede cancelar.' });
        }

        // Si el estado de la orden ya es "cancelado", no se puede modificar
        if (order.status === 'cancelado') {
            return res.status(400).json({ message: 'El pedido ya está cancelado y no puede ser modificado.' });
        }

        // Si el estado es "pagado", descontamos el stock solo si la orden está en estado "pendiente"
        if (status === 'pagado') {
            if (order.status === 'pagado') {
                // Si ya está pagado, no permitimos modificar el estado
                return res.status(400).json({ message: 'El estado ya es "pagado", no se puede modificar.' });
            }

            // Descontamos el stock de los productos solo si el estado está en "pendiente"
            if (order.status !== 'pagado') {
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

            // Finalmente, cambiamos el estado de la orden a "pagado"
            order.status = 'pagado';
        }

        // Si el estado cambia a "cancelado", no se puede cambiar más si ya está en "pagado"
        if (status === 'cancelado' && order.status !== 'pagado') {
            order.status = 'cancelado';
        } else if (status !== 'cancelado' && status !== 'pagado') {
            // Si el estado no es "pagado" ni "cancelado", simplemente se actualiza
            order.status = status;
        }

        // Guardar la orden con el nuevo estado
        await order.save();
        res.status(200).json(order);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error al actualizar el estado del pedido, intente nuevamente.' });
    }
};
