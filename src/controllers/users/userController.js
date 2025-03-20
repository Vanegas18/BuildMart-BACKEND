import User from "../../models/users/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Role from "../../models/rolesAndPermissions/rolesModel.js";
import { createAccessToken } from "../../middlewares/users/jwt.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import {
  UserSchema,
  updateUserSchema,
} from "../../middlewares/users/userValidation.js";
import {
  enviarCorreoRegistro,
  enviarCorreoRecuperacion,
} from "../../middlewares/users/configNodemailer.js";

dotenv.config();

// Registrar un nuevo usuario
export const newUser = async (req, res) => {
  try {
    // Datos requeridos en la petición
    let { cedula, nombre, correo, contraseña, telefono, direccion, rol } =
      req.body;

    // Verificar unicidad de la cedula
    const cedulaExistente = await User.findOne({ cedula });
    if (cedulaExistente) {
      return res.status(400).json({ error: "La cédula ya está registrada" });
    }

    // Verificar unicidad de el nombre
    const nombreExistente = await User.findOne({ nombre });
    if (nombreExistente) {
      return res.status(400).json({ error: "El nombre ya está registrado" });
    }

    // Verificar unicidad de el nombre
    const correoExistente = await User.findOne({ correo });
    if (correoExistente) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Verificar unicidad de el nombre
    const telefonoExistente = await User.findOne({ telefono });
    if (telefonoExistente) {
      return res.status(400).json({ error: "El telefono ya está registrado" });
    }

    // Hasheo de la contraseña
    const passwordHash = await bcrypt.hash(contraseña, 10);

    // Validaciones con zod
    const userValidate = UserSchema.safeParse({
      cedula,
      nombre,
      correo,
      contraseña,
      telefono,
      direccion,
    });
    if (!userValidate.success) {
      return res.status(400).json({
        error: userValidate.error,
      });
    }

    // Asignar rol por defecto "Cliente" si no se especifica
    if (!rol) {
      const rolCliente = await Role.findOne({ nombre: "Cliente" });
      if (!rolCliente) {
        return res.status(500).json({
          error: "El rol por defecto 'Cliente' no existe en la base de datos",
        });
      }
      rol = rolCliente._id; // Asignamos su ID
    }
    // Va a buscar el rol mandado por el body, en caso de que lo encuentre lo asigna
    const rolEncontrado = await Role.findById(rol);
    if (!rolEncontrado) {
      return res.status(400).json({ error: "El rol especificado no existe" });
    }

    // Crear y guardar el nuevo usuario
    const usuario = new User({
      cedula,
      nombre,
      correo,
      telefono,
      direccion,
      contraseña: passwordHash,
      rol,
    });
    await usuario.save();

    // Generar log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : "SISTEMA",
      fecha: new Date(),
      accion: "crear",
      entidad: "Usuario",
      entidadId: usuario._id,
      cambios: {
        previo: null,
        nuevo: usuario,
      },
    });

    // Enviar correo de bienvenida al usuario
    await enviarCorreoRegistro(correo, rolEncontrado.nombre);

    // Generar token JWT para la sesión
    const token = await createAccessToken({ id: usuario.usuarioId });

    /// Establecer cookie de autenticación
    res.cookie("token", token);

    // Respuesta exitosa
    res.status(201).json({
      message: "Usuario creado exitosamente",
      data: usuario,
    });
  } catch (error) {
    // Validaciones de unicidad
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `El ${field} ya está en uso` });
    }
    // Manejar otros errores
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener todos los usuarios
export const getUsers = async (req, res) => {
  try {
    const usuarios = await User.find().populate("rol", "nombre");
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

// Obtener usuario por Id
export const getUserById = async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const usuario = await User.findOne({ usuarioId }).populate("rol", "nombre");
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  const { usuarioId } = req.params;
  const { rol, nombre, cedula } = req.body;
  try {
    // Validar datos de actualización con Zod
    const updateUserValidate = updateUserSchema.safeParse(req.body);
    if (!updateUserValidate.success) {
      return res.status(400).json({
        error: updateUserValidate.error,
      });
    }

    // Obtener usuario antes de actualizar para el log
    const usuarioAnterior = await User.findOne({ usuarioId });
    if (!usuarioAnterior) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar unicidad de cédula (solo si se está cambiando)
    if (cedula && cedula !== usuarioAnterior.cedula) {
      const cedulaExistente = await User.findOne({
        cedula,
        usuarioId: { $ne: usuarioId },
      });

      if (cedulaExistente) {
        return res.status(400).json({ error: "La cédula ya está registrada" });
      }
    }

    // Verificar unicidad de nombre (solo si se está cambiando)
    if (nombre && nombre !== usuarioAnterior.nombre) {
      const nombreExistente = await User.findOne({
        nombre,
        usuarioId: { $ne: usuarioId },
      });

      if (nombreExistente) {
        return res.status(400).json({ error: "El nombre ya está registrado" });
      }
    }

    // Verificar que el rol exista (si se está actualizando)
    if (rol) {
      const rolExistente = await Role.findById(rol);
      if (!rolExistente) {
        return res.status(400).json({ error: "El rol especificado no existe" });
      }
    }

    // Actualizar usuario y obtener documento actualizado
    const usuario = await User.findOneAndUpdate(
      { usuarioId },
      req.body,
      {
        new: true,
      } // Devuelve el documento actualizado
    );

    // Generar log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : "SISTEMA",
      fecha: new Date(),
      accion: "actualizar",
      entidad: "Usuario",
      entidadId: usuarioId,
      cambios: {
        previo: usuarioAnterior,
        nuevo: usuario,
      },
    });

    // Responder con éxito y datos actualizados
    res.json({
      message: "Usuario actualizado exitosamente",
      data: usuario,
    });
  } catch (error) {
    // Validaciones de unicidad
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `El ${field} ya está en uso` });
    }
    // Manejar otros errores
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Actualizar estado de usuario
export const updateStateUser = async (req, res) => {
  const { usuarioId } = req.params;
  try {
    // Buscar usuario por ID
    const usuario = await User.findOne({ usuarioId });
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Guardar estado anterior para el log
    const estadoAnterior = usuario.estado;

    // Alternar estado entre "Activo" e "Inactivo"
    usuario.estado = usuario.estado === "Activo" ? "Inactivo" : "Activo";

    // Guarda el usuario
    await usuario.save();

    // Generar log de auditoría para el cambio de estado
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : "SISTEMA",
      fecha: new Date(),
      accion: "cambiar_estado",
      entidad: "Usuario",
      entidadId: usuario._id,
      cambios: {
        previo: { estado: estadoAnterior },
        nuevo: { estado: usuario.estado },
      },
    });

    // Responder con éxito y datos actualizados
    res.json({
      message: `Cambio de estado exitosamente`,
      data: usuario,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar el estado de el usuario" });
  }
};

// Login de usuarios
export const loginUser = async (req, res) => {
  const { correo, contraseña } = req.body;
  try {
    // Buscar usuario por correo
    const usuarioPorCorreo = await User.findOne({ correo });
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
    await LogAuditoria.create({
      usuario: usuarioPorCorreo._id,
      fecha: new Date(),
      accion: "iniciar_sesion",
      entidad: "Usuario",
      entidadId: usuarioPorCorreo._id,
      cambios: null,
    });

    // Generar token JWT para la sesión
    const token = await createAccessToken({ id: usuarioPorCorreo._id });

    // Establecer cookie de autenticación
    res.cookie("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

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
  const { correo, nuevaContraseña } = req.body;
  try {
    // Verificar que el usuario exista
    const usuario = await User.findOne({ correo });
    if (!usuario) {
      return res
        .status(404)
        .json({ error: "No existe una cuenta con ese correo" });
    }

    // Guardar contraseña anterior para el log (hash)
    const contraseñaAnterior = usuario.contraseña;

    // Hasher la nueva contraseña
    const passwordHash = await bcrypt.hash(nuevaContraseña, 10);
    usuario.contraseña = passwordHash;
    await usuario.save();

    // Registrar cambio de contraseña en el log de auditoría
    await LogAuditoria.create({
      usuario: usuario._id,
      fecha: new Date(),
      accion: "recuperar_contraseña",
      entidad: "Usuario",
      entidadId: usuario._id,
      cambios: {
        previo: { contraseña: contraseñaAnterior },
        nuevo: { contraseña: passwordHash },
      },
    });

    // Enviar correo de bienvenida al usuario
    await enviarCorreoRecuperacion(correo);

    res.json({
      message:
        "Contraseña restablecida correctamente. Ahora puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Verificar token de autenticación
export const verifyToken = async (req, res) => {
  try {
    // Obtener el token del usuario desde la petición
    const { token } = req.cookies;

    // Si no hay token en las cookies, intentar obtenerlo del header Authorization
    const headerToken = req.headers.authorization?.split(" ")[1];

    if (!token && !headerToken) {
      return res
        .status(401)
        .json({ message: "No se proporcionó token de autenticación" });
    }

    const tokenToVerify = token || headerToken;

    // Verificar y decodificar el token
    const decoded = jwt.verify(tokenToVerify, JWT_CONFIG.SECRET_KEY);
    console.log("Token decodificado:", decoded);

    // Buscar el usuario por el ID contenido en el token
    const user = await User.findOne({ usuarioId: decoded.id }).select(
      "-contraseña"
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar que el usuario esté activo
    if (user.estado !== "Activo") {
      return res
        .status(403)
        .json({ message: "Esta cuenta se encuentra inactiva" });
    }

    // Si todo está correcto, renovar el token
    const newToken = await createAccessToken({ id: user.usuarioId });

    // Actualizar la cookie con el nuevo token
    res.cookie("token", newToken, {
      httpOnly: false,
      secure: false, // Establecido manualmente (true para HTTPS, false para HTTP)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: "/",
    });

    // Devolver la información del usuario
    return res.json({
      id: user._id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
    });
  } catch (error) {
    console.error("Error en verificación de token:", error);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
