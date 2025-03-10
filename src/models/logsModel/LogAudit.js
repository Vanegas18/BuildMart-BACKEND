import mongoose from "mongoose";
const { Schema } = mongoose;

const logAuditoriaSchema = new Schema(
  {
    usuario: {
      type: Schema.Types.Mixed,
      required: true,
      description: "ID del usuario que realizó la acción",
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true,
      description: "Fecha y hora en que se realizó la acción",
    },
    accion: {
      type: String,
      required: true,
      enum: [
        "crear",
        "actualizar",
        "eliminar",
        "restaurar",
        "cambiar_estado",
        "iniciar_sesion",
        "cerrar_sesion",
        "recuperar_contraseña",
      ],
      description: "Tipo de acción realizada",
    },
    entidad: {
      type: String,
      required: true,
      description: "Nombre de la entidad/modelo afectado",
    },
    entidadId: {
      type: Schema.Types.Mixed,
      required: true,
      description: "ID del documento afectado",
    },
    cambios: {
      previo: {
        type: Schema.Types.Mixed,
        default: null,
        description: "Estado anterior del documento (null para creaciones)",
      },
      nuevo: {
        type: Schema.Types.Mixed,
        default: null,
        description: "Nuevo estado del documento (null para eliminaciones)",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para mejorar el rendimiento en consultas comunes
logAuditoriaSchema.index({ usuario: 1, fecha: -1 });
logAuditoriaSchema.index({ entidad: 1, entidadId: 1 });
logAuditoriaSchema.index({ fecha: -1 });
logAuditoriaSchema.index({ accion: 1 });

const LogAuditoria = mongoose.model("LogAuditoria", logAuditoriaSchema);

export default LogAuditoria;
