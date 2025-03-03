import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, default: Date.now },
    productos: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'productos', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    total: { type: Number, required: true }
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
