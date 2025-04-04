import User from "../../../models/users/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createAccessToken } from "../../../middlewares/users/jwt.js";
import { AUTH_CONFIG } from "../../../middlewares/auth/configAuth.js";
import LogAuditoria from "../../../models/logsModel/LogAudit.js";
import {
  enviarCorreoRecuperacion,
  enviarCorreoConfirmacionCambio,
  generarTokenRecuperacion,
} from "../../../middlewares/users/configNodemailer.js";

dotenv.config();

// Login de usuarios
export const loginUser = async (req, res) => {
  const { correo, contraseña } = req.body;
  try {
    // Buscar usuario por correo
    const usuarioPorCorreo = await User.findOne({ correo }).lean();
    if (!usuarioPorCorreo) {
      return res.status(400).json({
        message: "No se encontró a ningún usuario registrado con ese correo",
      });
    }

    // Verificar si el usuario está activo
    if (usuarioPorCorreo.estado !== "Activo") {
      return res.status(403).json({
        message:
          "Esta cuenta se encuentra inactiva. Contacte al administrador.",
      });
    }

    // Verificar contraseña
    const passwordCompare = usuarioPorCorreo
      ? await bcrypt.compare(contraseña, usuarioPorCorreo.contraseña)
      : false;

    if (!passwordCompare) {
      return res.status(400).json({
        message: "Contraseña incorrecta",
      });
    }

    // Registrar evento de inicio de sesión
    LogAuditoria.create({
      usuario: usuarioPorCorreo._id,
      fecha: new Date(),
      accion: "iniciar_sesion",
      entidad: "Usuario",
      entidadId: usuarioPorCorreo._id,
      cambios: null,
    }).catch((error) =>
      console.error("Error al crear log de auditoría:", error)
    );

    // Generar token JWT para la sesión
    const token = await createAccessToken({ id: usuarioPorCorreo._id });

    // Establecer cookie de autenticación
    res.cookie("token", token);

    res.status(200).json({
      message: "Usuario logueado correctamente",
      usuario: {
        nombre: usuarioPorCorreo.nombre,
        correo: usuarioPorCorreo.correo,
        rol: usuarioPorCorreo.rol,
      },
      token: token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Cerrar sesión
export const logoutUser = async (req, res) => {
  try {
    // Registrar evento de cierre de sesión si hay un usuario autenticado
    if (req.usuario) {
      await LogAuditoria.create({
        usuario: req.usuario.id,
        fecha: new Date(),
        accion: "cerrar_sesion",
        entidad: "Usuario",
        entidadId: req.usuario.id,
        cambios: null,
      });
    }

    // Invalidar la cookie de sesión
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

// Solicitar recuperar contraseña
export const forgotPassword = async (req, res) => {
  const { correo } = req.body;
  try {
    // Verificar que el usuario exista
    const usuario = await User.findOne({ correo });
    if (!usuario) {
      return res
        .status(404)
        .json({ error: "No existe una cuenta con ese correo" });
    }

    // Generar token JWT para recuperación
    const token = generarTokenRecuperacion(usuario._id, correo);

    // Enviar correo de bienvenida al usuario
    await enviarCorreoRecuperacion(correo, token);

    return res.json({
      message:
        "Se ha enviado un correo con instrucciones para restablecer tu contraseña",
    });
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Controlador para restablecer la contraseña usando el token JWT
export const resetPassword = async (req, res) => {
  const { token, nuevaContraseña } = req.body;
  const secretKey = process.env.JWT_SECRET || "KeyIdUsuario";

  try {
    // Verificar y decodificar el token
    const payload = jwt.verify(token, secretKey);

    // Verificar que sea un token de recuperación
    if (payload.tipo !== "recuperacion") {
      return res.status(400).json({
        error: "Token inválido para recuperación de contraseña",
      });
    }

    // Buscar el usuario por id
    const usuario = await User.findById(payload.id);
    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Verificar que el correo coincida
    if (usuario.correo !== payload.correo) {
      return res.status(400).json({
        error: "Token inválido para este usuario",
      });
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(nuevaContraseña, 10);

    // Actualizar contraseña
    usuario.contraseña = passwordHash;
    await usuario.save();

    // Registrar cambio en log de auditoría
    await LogAuditoria.create({
      usuario: usuario._id,
      fecha: new Date(),
      accion: "restablecer_contraseña",
      entidad: "Usuario",
      entidadId: usuario._id,
      cambios: {
        previo: { contraseña: "******" }, // No guardar el hash por seguridad
        nuevo: { contraseña: "******" },
      },
    });

    // Enviar correo de confirmación
    await enviarCorreoConfirmacionCambio(usuario.correo);

    res.json({
      message:
        "Contraseña restablecida correctamente. Ahora puedes iniciar sesión.",
    });
  } catch (error) {
    // Si el token expiró o es inválido
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(400).json({
        error: "El enlace de recuperación no es válido o ha expirado",
      });
    }

    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Verificar cookie
export const verifyToken = async (req, res) => {
  // Obtener token desde cookies o desde headers
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  if (!token) return res.status(401).json({ message: "No autorizado 1" });

  jwt.verify(token, AUTH_CONFIG.SECRET_KEY, async (err, usuario) => {
    if (err) return res.status(401).json({ message: "No autorizado 2" });

    const userFound = await User.findById(usuario.id);
    if (!userFound) return res.status(401).json({ message: "No autorizado 3" });

    return res.json({
      id: userFound._id,
      nombre: userFound.nombre,
      correo: userFound.correo,
      rol: userFound.rol,
    });
  });
};
