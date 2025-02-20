// Importamos el módulo 'jsonwebtoken' que nos permite trabajar con JSON Web Tokens (JWT)
import jwt from "jsonwebtoken";

/**
 *
 * Un token de acceso es un string que se usa para autenticar a un usuario en una aplicación.
 * Este token incluye información (payload) y está firmado con una clave secreta para garantizar su seguridad.
 *
 * @param {Object} payload - La información que queremos incluir dentro del token (por ejemplo, ID de usuario, rol, etc.).
 * @returns {Promise<string>} - Retorna una promesa que resuelve con el token generado o se rechaza si hay un error.
 */
export function createAccessToken(payload) {
  return new Promise((resolve, reject) => {
    /**
     * jwt.sign() se usa para generar un nuevo token.
     *
     * Parámetros:
     * 1. `payload`: La información que queremos incluir en el token.
     * 2. `"KeyIdUsuario"`: La clave secreta usada para firmar el token. Es importante NO dejarla en el código,
     *    sino almacenarla en una variable de entorno por seguridad.
     * 3. `{ expiresIn: "1d" }`: Configuración del token, en este caso, hacemos que expire en 1 día.
     * 4. Callback que recibe `error` y `token`. Si hay error, rechazamos la promesa; si no, la resolvemos con el token generado.
     */
    jwt.sign(payload, "KeyIdUsuario", { expiresIn: "1d" }, (error, token) => {
      if (error) {
        console.error("Error al generar el token:", error);
        return reject(new Error("No se pudo generar el token"));
      }
      // Si el token se genera correctamente, resolvemos la promesa con el token.
      resolve(token);
    });
  });
}
