import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
    saleId: { type: mongoose.Schema.Types.ObjectId, default: mongoose.Types.ObjectId },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, default: Date.now },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    total: { type: Number, required: true }
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
