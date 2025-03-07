import jwt from "jsonwebtoken";

/**
 * Middleware para verificar el token de autenticación.
 * Se espera que el token se envíe en el encabezado Authorization con el formato: Bearer <token>.
 */

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Token de autenticación no proporcionado" });
  }

  const token = authHeader.split(" ")[1]; // Extraer el token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Agregar los datos del usuario a la solicitud
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
