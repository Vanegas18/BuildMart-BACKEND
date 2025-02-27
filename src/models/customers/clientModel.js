import mongoose from 'mongoose';
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const clientSchema = new mongoose.Schema({
    clientId: { type: Number, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: [/\S+@\S+\.\S+/, 'is invalid'] },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    department: { type: String, required: true },
    city: { type: String, required: true },
    status: { type: String, enum: ['activo', 'inactivo'], default: 'activo' }
},
{ timestamps: true, versionKey: false }
);

clientSchema.plugin(AutoIncrementFactory, {
    inc_field: "clientId",
  });

export default mongoose.model("Clients", clientSchema);
