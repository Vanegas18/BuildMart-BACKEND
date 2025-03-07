import mongoose from "mongoose";

// Definimos una función asíncrona para gestionar la conexión a la base de datos.
export async function dbConnection() {
  try {
    // Intentamos establecer la conexión con la base de datos usando la URI proporcionada en las variables de entorno.
    mongoose.connect(process.env.MONGO_CNN);
    console.log("✅ Conectado correctamente a la base de datos!");
    
  } catch (error) {
    // Capturamos cualquier error durante la conexión y lo mostramos en consola.
    console.error(
      `❌ Error al conectar con la base de datos. ERROR: ${error.message}`
    );
    process.exit(1);
  }
}
