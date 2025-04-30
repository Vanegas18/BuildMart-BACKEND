import User from "../../models/users/userModel.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Role from "../../models/rolesAndPermissions/rolesModel.js";
import { createAccessToken } from "../../middlewares/users/jwt.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import {
  UserSchema,
  updateUserSchema,
} from "../../middlewares/users/userValidation.js";
import {
  enviarCorreoConfiguracionAdmin,
  enviarCorreoRegistro,
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

    // Enviar correo específico según el rol
    if (rolEncontrado.nombre === "Administrador") {
      // Si es administrador, enviamos correo para configurar contraseña
      await enviarCorreoConfiguracionAdmin(correo, usuario._id);
    } else {
      // Para otros roles, enviar correo de bienvenida estándar
      await enviarCorreoRegistro(correo, rolEncontrado.nombre);
    }

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
  const { rol, nombre, cedula, contraseña } = req.body;
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

    // Crear objeto con los datos a actualizar
    const datosActualizados = { ...req.body };

    // Si se está actualizando la contraseña, hashearla
    if (contraseña) {
      try {
        // Usar 10 como número de rondas de sal (estándar)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
        datosActualizados.contraseña = hashedPassword;
      } catch (hashError) {
        return res
          .status(500)
          .json({ error: "Error al procesar la contraseña" });
      }
    }

    // Actualizar usuario y obtener documento actualizado
    const usuario = await User.findOneAndUpdate(
      { usuarioId },
      datosActualizados,
      {
        new: true,
      } // Devuelve el documento actualizado
    );

    // Para evitar mostrar la contraseña hasheada en la respuesta
    const usuarioRespuesta = usuario.toObject();
    if (usuarioRespuesta.contraseña) {
      usuarioRespuesta.contraseña = "*******"; // O reemplazar con '********'
    }

    // Generar log de auditoría
    await LogAuditoria.create({
      usuario: req.usuario ? req.usuario.id : "SISTEMA",
      fecha: new Date(),
      accion: "actualizar",
      entidad: "Usuario",
      entidadId: usuarioId,
      cambios: {
        previo: {
          ...usuarioAnterior.toObject(),
          contraseña: contraseña ? "********" : usuarioAnterior.contraseña,
        },
        nuevo: {
          ...usuarioRespuesta,
          contraseña: contraseña ? "********" : usuarioRespuesta.contraseña,
        },
      },
    });

    // Responder con éxito y datos actualizados
    res.json({
      message: "Usuario actualizado exitosamente",
      data: usuarioRespuesta,
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
    const usuario = await User.findOne({ usuarioId }).populate("rol");
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Guardar estado anterior para el log
    const estadoAnterior = usuario.estado;

    // Verificar si es un administrador que se está intentando desactivar
    if (usuario.estado === "Activo" && usuario.rol.nombre === "Administrador") {
      // Contar cuántos administradores activos hay en el sistema
      const administradoresActivos = await User.countDocuments({
        rol: usuario.rol._id,
        estado: "Activo",
      });

      // Si solo hay un administrador activo y estamos intentando desactivarlo
      if (administradoresActivos === 1) {
        return res.status(400).json({
          error: "No se puede desactivar al último administrador del sistema",
        });
      }
    }

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
