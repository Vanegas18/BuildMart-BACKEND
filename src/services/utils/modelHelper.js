// src/services/utils/modelHelper.js
import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrementFactory = mongooseSequence(mongoose);

/**
 * Crea un modelo Mongoose con autoincremento seguro para entornos con hot reload
 * @param {string} modelName - Nombre del modelo en MongoDB (ej: "categorias_Productos")
 * @param {mongoose.Schema} schema - Schema de Mongoose
 * @param {string} incField - Campo para autoincremento (ej: "categoriaId")
 * @returns {mongoose.Model} Modelo de Mongoose
 */
export const createAutoIncrementModel = (modelName, schema, incField) => {
  // Verifica si el modelo ya existe (evita duplicados en hot reload)
  if (mongoose.models && mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  // Genera un ID único para el contador basado en el nombre del modelo y el campo
  // Esto evita colisiones entre diferentes modelos que usan el mismo nombre de campo
  const counterId = `${modelName}_${incField}`;

  // Aplica el plugin de autoincremento solo si el modelo no existe
  schema.plugin(AutoIncrementFactory, {
    inc_field: incField,
    id: counterId, // Identificador único para el contador
    disable_hooks: false,
  });

  // Crea y retorna el modelo
  return mongoose.model(modelName, schema);
};
