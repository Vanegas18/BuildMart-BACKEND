import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

const ProveedoresSchema = new mongoose.Schema(
    {
        proveedorId: {type: Number, unique: true},
        nit: {
            type: String,
            required: [true, "El NIT es obligatorio"],
            unique: true,
            trim: true, 
        },
        nombre: {
            type: String,
            required: [true, "El nombre es obligatorio"],
            unique: true,
            trim: true,
        },
        direccion: {
            type: String,
            required: [true, "La dirección es obligatoria"],
            trim: true,
        },
        telefono: {
            type: String,
            required: [true, "El número de teléfono es obligatorio"],
            unique: true,
            trim: true,
        },
        correo: {
            type: String,
            required: [true, "El correo es obligatorio"],
            unique: true,
            trim: true,
        },
        categoriaProveedorId: [
            {
            type: mongoose.Schema.Types.ObjectId, // Con esto traemos el modelo al cual vamos a hacer referencia
            ref: 'CategoriasProveedor', // Con esto traemos el objeto el cual vamos a referenciar, en este caso el id de la categoría
            required: true,
        }
    ],
        estado: {type: String, default: "Activo", enum: ["Activo", "Inactivo"]},
    },
    {timestamps: true, versionKey: false},
);
ProveedoresSchema.plugin(AutoIncrementFactory, {
    inc_field: "proveedorId",
});

const Proveedor = mongoose.model('Proveedor', ProveedoresSchema);

export default Proveedor;