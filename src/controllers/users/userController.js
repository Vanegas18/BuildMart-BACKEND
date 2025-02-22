import User from "../../models/users/userModel.js";
import bcrypt from "bcrypt";
import Role from "../../models/rolesAndPermissions/rolesModel.js";
import { createAccessToken } from "../../middlewares/users/jwt.js";
import {
  UserSchema,
  updateUserSchema,
} from "../../middlewares/users/userValidation.js";
import {
  transporter,
  enviarCorreoRegistro,
  generarHtmlRecuperacion,
} from "../../middlewares/users/configNodemailer.js";

// Registrar un nuevo usuario
export const newUser = async (req, res) => {
  try {
    let { nombre, correo, contraseña, telefono, direccion, rol } = req.body;

    const passwordHash = await bcrypt.hash(contraseña, 10);

    UserSchema.parse({
      nombre,
      correo,
      contraseña,
      telefono,
      direccion,
    });

    // Si el usuario no envía un rol, asignamos "Cliente" por defecto
    if (!rol) {
      const rolCliente = await Role.findOne({ nombre: "Cliente" }); // Buscar el ID del rol "Cliente"
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

    const usuario = new User({
      nombre,
      correo,
      telefono,
      direccion,
      contraseña: passwordHash,
      rol,
    });

    await usuario.save();
    await enviarCorreoRegistro(correo, rolEncontrado.nombre);

    // TOKEN PARA EL REGISTRO
    const token = await createAccessToken({ id: usuario.usuarioId });

    // Se crea la cookie con el nombre cookie, y con el valor de la cookie
    res.cookie("token", token);

    // Respuesta
    res.status(201).json({
      message: "Usuario creado exitosamente",
      data: usuario,
    });
  } catch (error) {
    // Validaciones de unicidad
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0]; // Obtiene el campo duplicado
      return res.status(400).json({ error: `El ${field} ya está en uso` });
    }
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
  try {
    updateUserSchema.parse(req.params);

    const usuario = await User.findOneAndUpdate({ usuarioId }, req.body, {
      new: true,
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario actualizado exitosamente",
      data: usuario,
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Actualizar estado de usuario
export const updateStateUser = async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const usuario = await User.findOne({ usuarioId });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    usuario.estado = usuario.estado === "Activo" ? "Inactivo" : "Activo";
    await usuario.save();

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
    const usuarioPorCorreo = await User.findOne({ correo });

    if (!usuarioPorCorreo) {
      return res.status(400).json({
        message: "No se encontró a ningún usuario registrado con ese correo",
      });
    }

    const passwordCompare = await bcrypt.compare(
      contraseña,
      usuarioPorCorreo.contraseña
    );

    if (!passwordCompare) {
      return res.status(400).json({
        message: "Contraseña incorrecta",
      });
    }

    // TOKEN PARA EL INICIO DE SESIÓN
    const token = await createAccessToken({ id: usuarioPorCorreo.usuarioId });

    res.cookie("token", token);
    res.status(201).json({
      message: "Usuario logueado correctamente",
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Cerrar sesión
export const logoutUser = async (req, res) => {
  res.cookie("token", "", { expires: new Date(0) });
  return res.json("Usuario deslogueado correctamente");
};

// Solicitar recuperar contraseña
export const forgotPassword = async (req, res) => {
  const { correo, nuevaContraseña } = req.body;
  try {
    const usuario = await User.findOne({ correo });

    if (!usuario) {
      return res
        .status(404)
        .json({ error: "No existe una cuenta con ese correo" });
    }

    // Hasher la nueva contraseña
    const passwordHash = await bcrypt.hash(nuevaContraseña, 10);
    usuario.contraseña = passwordHash;
    await usuario.save();

    // Opciones de correo
    const mailOptions = {
      from: process.env.userGmail,
      to: usuario.correo,
      subject: "🔑 Contraseña Restablecida",
      html: generarHtmlRecuperacion(),
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message:
        "Contraseña restablecida correctamente. Ahora puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
