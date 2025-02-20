import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrementFactory = mongooseSequence(mongoose);

const CategoriaProveedorSchema = new mongoose.Schema({
    categoriaProveedorId: { type: Number, unique: true },
    name: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        minlength: 3,
        trim: true,
    },
    descripcion: {
        type: String,
        trim: true,
        required: [true, "La descripción es obligatoria"],
    },
    estado: { type: String, default: "Activo", enum: ["Activo", "Inactivo"] },
}, { timestamps: true, versionKey: false });

CategoriaProveedorSchema.plugin(AutoIncrementFactory, {
    inc_field: "categoriaProveedorId",
});

const CategoriasProveedor = mongoose.model('CategoriasProveedor', CategoriaProveedorSchema);

export default CategoriasProveedor;
