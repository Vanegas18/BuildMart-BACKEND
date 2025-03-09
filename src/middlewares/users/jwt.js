// Importamos el módulo 'jsonwebtoken' que nos permite trabajar con JSON Web Tokens (JWT)
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Configuración centralizada para JWT
const JWT_CONFIG = {
  SECRET_KEY: process.env.JWT_SECRET || "KeyIdUsuario",
  DEFAULT_EXPIRATION: "1h", // Tiempo de expiración predeterminado
  ERROR_MESSAGES: {
    GENERATION_FAILED: "No se pudo generar el token",
    VERIFICATION_FAILED: "Token inválido o expirado",
  },
};

/**
 * Genera un token de acceso JWT con la información proporcionada
 *
 * Un token de acceso es un string que se usa para autenticar a un usuario en una aplicación.
 * Este token incluye información (payload) y está firmado con una clave secreta para garantizar su seguridad.
 *
 * @param {Object} payload - La información que queremos incluir dentro del token (por ejemplo, ID de usuario, rol, etc.).
 * @param {string} [expiresIn=JWT_CONFIG.DEFAULT_EXPIRATION] - Tiempo de expiración del token (1d = 1 día por defecto)
 * @returns {Promise<string>} - Retorna una promesa que resuelve con el token generado o se rechaza si hay un error.
 */

export function createAccessToken(
  payload,
  expiresIn = JWT_CONFIG.DEFAULT_EXPIRATION
) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_CONFIG.SECRET_KEY, { expiresIn }, (error, token) => {
      if (error) {
        console.error("Error al generar el token:", error);
        return reject(new Error(JWT_CONFIG.ERROR_MESSAGES.GENERATION_FAILED));
      }
      // Si el token se genera correctamente, resolvemos la promesa con el token.
      resolve(token);
    });
  });
}
