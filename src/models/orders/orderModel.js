import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    products: [
        {
            productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'productos', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pendiente', 'pagado', 'cancelado'],
        default: 'pendiente'
    }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
