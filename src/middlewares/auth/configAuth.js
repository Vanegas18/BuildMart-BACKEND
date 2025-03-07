// middlewares/auth/authMiddleware.js
import Usuario from "../../models/users/userModel.js"; // Ajusta según tu estructura
import jwt from "jsonwebtoken"

/**
 * Middleware para verificar si el usuario está autenticado
 */
export const verificarAutenticacion = (req, res, next) => {
  // Obtener el token de la cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      error: "Acceso denegado. Debe iniciar sesión",
    });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, "KeyIdUsuario"); // Usar la misma clave secreta

    // Guardar la información del usuario decodificada en la request
    req.usuario = decoded;

    next();
  } catch (error) {
    console.error("Error al verificar el token:", error);
    return res.status(401).json({
      error: "Token inválido o expirado. Inicie sesión nuevamente.",
    });
  }
};

/**
 * Middleware para verificar si el usuario es administrador
 */
export const verificarAdmin = async (req, res, next) => {
  try {
    // Primero verificamos que esté autenticado con el token
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: "Acceso denegado. Debe iniciar sesión",
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, "KeyIdUsuario");

    // Buscar usuario en la base de datos
    const usuario = await Usuario.findOne({ usuarioId: decoded.id });

    if (!usuario) {
      return res.status(401).json({
        error: "Usuario no encontrado",
      });
    }

    // Verificar si es administrador (probablemente necesites ajustar esto según tu modelo)
    // Parece que usas un ObjectId para el rol, así que debes comparar con el ID correcto
    // o implementar una función para verificar si el rol es de administrador
    if (usuario.rol.toString() !== "67ca3cad97cdae1f2b812a95") {
      // Ajusta este ID al ObjectId del rol admin
      return res.status(403).json({
        error: "Acceso denegado. Se requiere rol de administrador",
      });
    }

    // Usuario es administrador, continuamos
    req.usuario = { id: usuario.usuarioId };
    next();
  } catch (error) {
    console.error("Error en verificación de admin:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
