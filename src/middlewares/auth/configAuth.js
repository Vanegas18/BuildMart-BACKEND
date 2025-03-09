import Usuario from "../../models/users/userModel.js"; // Ajusta según tu estructura
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();


/**
 * Configuración general de autenticación
 * Centraliza valores como la clave secreta y los IDs de roles para facilitar mantenimiento
 */

const AUTH_CONFIG = {
  SECRET_KEY: process.env.JWT_SECRET,
  ROLES: {
    ADMIN: "67cb9a4fa5866273d8830fad",
  },
  MESSAGES: {
    NO_TOKEN: "Acceso denegado. Debe iniciar sesión",
    INVALID_TOKEN: "Token inválido o expirado. Inicie sesión nuevamente.",
    USER_NOT_FOUND: "Usuario no encontrado",
    NOT_ADMIN: "Acceso denegado. Se requiere rol de administrador",
    SERVER_ERROR: "Error en el servidor",
  },
};

// Extrae y verifica el token JWT de las cookies
const extractAndVerifyToken = (req) => {
  const token = req.cookies.token;
  
  if (!token) {
    return { error: AUTH_CONFIG.MESSAGES.NO_TOKEN, status: 401 };
  }
  
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.SECRET_KEY);
    return { decoded };
  } catch (error) {
    console.error("Error al verificar el token:", error);
    return { error: AUTH_CONFIG.MESSAGES.INVALID_TOKEN, status: 401 };
  }
};


// Middleware para verificar si el usuario está autenticado
export const verificarAutenticacion = (req, res, next) => {
  const result = extractAndVerifyToken(req);
  
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  
  // Guardar la información del usuario decodificada en la request
  req.usuario = result.decoded;
  next();
};

// Middleware para verificar si el usuario es administrador
export const verificarAdmin = async (req, res, next) => {
  try {
    // Verificamos la autenticación con el token
    const result = extractAndVerifyToken(req);
    
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    
    // Buscar usuario en la base de datos
    const usuario = await Usuario.findOne({ usuarioId: result.decoded.id });
    
    if (!usuario) {
      return res.status(401).json({
        error: AUTH_CONFIG.MESSAGES.USER_NOT_FOUND
      });
    }
    
    // Verificar si es administrador
    if (usuario.rol.toString() !== AUTH_CONFIG.ROLES.ADMIN) {
      return res.status(403).json({
        error: AUTH_CONFIG.MESSAGES.NOT_ADMIN
      });
    }
    
    // Usuario es administrador, continuamos
    req.usuario = { id: usuario.usuarioId };
    next();
  } catch (error) {
    console.error("Error en verificación de admin:", error);
    res.status(500).json({ error: AUTH_CONFIG.MESSAGES.SERVER_ERROR });
  }
};
