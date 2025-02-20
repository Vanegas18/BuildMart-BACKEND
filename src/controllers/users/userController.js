import User from "../../models/users/userModel.js";
import {
  UserSchema,
  updateUserSchema,
} from "../../middlewares/users/userValidation.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createAccessToken } from "../../middlewares/users/jwt.js";
import Role from "../../models/rolesAndPermissions/rolesModel.js";

dotenv.config();

// CONFIGURACIÓN NODEMAILER
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.userGmail,
    pass: process.env.passAppGmail,
  },
});

// Función para generar HTML dinámico del correo según el rol
const generarHtmlCorreo = (nombreRol) => {
  let resetUrl = "http://localhost:3000/views/Usuario/usuario.html"; // Mejor usar una variable de entorno

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Bienvenido a <span style="color: #007bff;">Build Mart</span> 🎉</h2>
      <p style="color: #555; font-size: 16px;">
        ¡Su registro fue exitoso! 
        ${
          nombreRol === "Administrador"
            ? "Para gestionar la plataforma, inicie sesión y configure sus preferencias. Además, le recomendamos cambiar su contraseña:"
            : "Gracias por registrarse en nuestra tienda. ¡Esperamos que disfrute su experiencia con nosotros!"
        }
      </p>
      
      ${
        nombreRol === "Administrador"
          ? `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" target="_blank" style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
          🔐 Cambiar Contraseña
        </a>
      </div>`
          : ""
      }

      <p style="color: #777; font-size: 14px; text-align: center;">
        Si no ha solicitado este registro, ignore este mensaje.
      </p>
      <hr style="border: none; border-top: 1px solid #ddd;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        © 2025 Build Mart. Todos los derechos reservados.
      </p>
    </div>
  `;
};

// Función para enviar el correo de registro
const enviarCorreoRegistro = async (emailDestino, rol) => {
  try {
    const { userGmail } = process.env;
    const htmlCorreo = generarHtmlCorreo(rol);

    const mailOptions = {
      from: userGmail,
      to: emailDestino,
      subject: `🎉 Build Mart - Registro Exitoso`,
      html: htmlCorreo,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado a ${emailDestino}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`❌ Error al enviar el correo a ${emailDestino}:`, error);
    throw error;
  }
};

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

export const logoutUser = async (req, res) => {
  res.cookie("token", "", { expires: new Date(0) });
  return res.json("Usuario deslogueado correctamente");
};
