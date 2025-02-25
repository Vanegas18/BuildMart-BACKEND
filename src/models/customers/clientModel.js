import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: [/\S+@\S+\.\S+/, 'is invalid'] },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    department: { type: String, required: true },
    city: { type: String, required: true },
    status: { type: String, enum: ['activo', 'inactivo'], default: 'activo' }
});

const Client = mongoose.model('Client', clientSchema);
export default Client;
