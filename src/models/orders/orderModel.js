import mongoose from 'mongoose';
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const orderSchema = new mongoose.Schema({
    orderId: { type: Number, unique: true },
    date: { type: Date, default: Date.now },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    productos: [
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
},
{ timestamps: true, versionKey: false }
);

orderSchema.plugin(AutoIncrementFactory, {
    inc_field: "orderId",
  });

export default mongoose.model("Orders", orderSchema);
