import { validationResult } from "express-validator";
import Clients from "../../models/customers/clientModel.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { enviarCorreoRegistro } from "../../middlewares/users/configNodemailer.js";
import { createAccessToken } from "../../middlewares/users/jwt.js";

// Obtener todos los clientes o un cliente específico
export const getClients = async (req, res) => {
  try {
    const { id } = req.params;

    // Si hay un id en los parámetros, buscamos un cliente específico
    if (id) {
      // Verificar si el id es un ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de cliente no válido." });
      }

      const client = await Clients.findById(id);

      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado." });
      }

      return res.status(200).json(client);
    }

    // Si no hay id, obtenemos todos los clientes
    const clients = await Clients.find();
    res.status(200).json(clients);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: "Error al obtener los clientes, intente nuevamente." });
  }
};

// Crear un nuevo cliente
export const createClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    nombre,
    correo,
    telefono,
    estado,
    cedula,
    contraseña,
    direcciones,
    metodosPago,
  } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const existingEmail = await Clients.findOne({ correo });
    if (existingEmail) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    // Verificar si la cédula ya está registrada
    const existingCedula = await Clients.findOne({ cedula });
    if (existingCedula) {
      return res.status(400).json({ message: "La cédula ya está registrada." });
    }

    // Verificar si el teléfono ya está registrado
    const existingTelefono = await Clients.findOne({
      telefono,
    });
    if (existingTelefono) {
      return res
        .status(400)
        .json({ message: "El teléfono ya está registrado." });
    }

    // Hasheo de la contraseña
    const passwordHash = await bcrypt.hash(contraseña, 10);

    // Crear el nuevo cliente
    const newClient = new Clients({
      nombre,
      correo,
      telefono,
      cedula,
      contraseña: passwordHash,
      estado,
      direcciones: direcciones || [],
      metodosPago: metodosPago || [],
    });

    await newClient.save();

    // Enviar correo de bienvenida al usuario
    await enviarCorreoRegistro(correo, "Cliente");

    // Generar token JWT para la sesión
    const token = await createAccessToken({ id: newClient.clienteId });

    // Establecer cookie de autenticación
    res.cookie("token", token);

    res
      .status(201)
      .json({ message: "Cliente creado exitosamente.", client: newClient });
  } catch (error) {
    // Otros errores
    console.error(error.message);
    res.status(500).json({
      error: error.message,
    });
  }
};

// Actualizar un cliente existente
export const updateClient = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    correo,
    telefono,
    cedula,
    contraseña,
    estado,
    direcciones,
    metodosPago,
  } = req.body;

  // Verificar si hay errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Buscar el cliente por ID
    const client = await Clients.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Validaciones de duplicados ANTES de actualizar

    // Verificar si el correo ya está registrado (y no es el mismo cliente)
    if (correo && correo !== client.correo) {
      const existingEmail = await Clients.findOne({
        correo,
        _id: { $ne: id }, // Excluir el cliente actual
      });
      if (existingEmail) {
        return res
          .status(400)
          .json({ message: "El correo ya está registrado." });
      }
    }

    // Verificar si la cédula ya está registrada (y no es el mismo cliente)
    if (cedula && cedula !== client.cedula) {
      const existingCedula = await Clients.findOne({
        cedula,
        _id: { $ne: id }, // Excluir el cliente actual
      });
      if (existingCedula) {
        return res
          .status(400)
          .json({ message: "La cédula ya está registrada." });
      }
    }

    // Verificar si el teléfono ya está registrado (y no es el mismo cliente)
    if (telefono && telefono !== client.telefono) {
      const existingTelefono = await Clients.findOne({
        telefono,
        _id: { $ne: id }, // Excluir el cliente actual
      });
      if (existingTelefono) {
        return res
          .status(400)
          .json({ message: "El teléfono ya está registrado." });
      }
    }

    // Actualizar los datos del cliente después de las validaciones
    if (nombre) client.nombre = nombre;
    if (correo) client.correo = correo;
    if (telefono) client.telefono = telefono;
    if (cedula) client.cedula = cedula;
    if (contraseña) {
      const passwordHash = await bcrypt.hash(contraseña, 10);
      client.contraseña = passwordHash;
    }
    if (estado) client.estado = estado;

    // Actualizar direcciones si se proporcionan
    if (direcciones) {
      client.direcciones = direcciones;

      // Actualizar también el campo de dirección principal si hay una dirección marcada como principal
      const direccionPrincipal = direcciones.find((d) => d.esPrincipal);
      if (direccionPrincipal) {
        client.direccion = direccionPrincipal.calle;
        client.ciudad = direccionPrincipal.ciudad;
        client.departamento = direccionPrincipal.departamento;
      }
    }

    // Actualizar métodos de pago si se proporcionan
    if (metodosPago) {
      client.metodosPago = metodosPago;
    }

    // Guardar los cambios
    await client.save();

    // Responder con el cliente actualizado
    res
      .status(200)
      .json({ message: "Cliente actualizado exitosamente.", client });
  } catch (error) {
    console.error(error.message);

    // Manejo específico para errores de duplicados de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldMessages = {
        correo: "El correo ya está registrado.",
        cedula: "La cédula ya está registrada.",
        telefono: "El teléfono ya está registrado.",
      };

      return res.status(400).json({
        message:
          fieldMessages[field] || "Ya existe un registro con estos datos.",
      });
    }

    res.status(500).json({
      message: "Error al actualizar el cliente, intente nuevamente.",
      error: error.message,
    });
  }
};
