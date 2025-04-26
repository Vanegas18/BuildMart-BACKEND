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
    direccion,
    departamento,
    ciudad,
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

    // Verificar si el nombre ya está registrado
    const existingNombre = await Clients.findOne({ nombre });
    if (existingNombre) {
      return res.status(400).json({ message: "El nombre ya está registrado." });
    }

    // Hasheo de la contraseña
    const passwordHash = await bcrypt.hash(contraseña, 10);

    // Preparar las direcciones (si existen)
    let clienteDirecciones = [];
    if (direcciones && direcciones.length > 0) {
      clienteDirecciones = direcciones;
    } else if (direccion) {
      // Si no hay direcciones múltiples pero sí hay dirección principal
      clienteDirecciones = [
        {
          tipo: "Casa",
          calle: direccion,
          ciudad,
          departamento,
          esPrincipal: true,
        },
      ];
    }

    // Crear el nuevo cliente
    const newClient = new Clients({
      nombre,
      correo,
      telefono,
      direccion,
      departamento,
      ciudad,
      cedula,
      contraseña: passwordHash,
      estado,
      direcciones: clienteDirecciones,
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
    console.error(error.message);
    res.status(500).json({
      error: error.errors || error.message,
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
    direccion,
    departamento,
    ciudad,
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

    // Actualizar los datos del cliente
    if (nombre) client.nombre = nombre;
    if (correo) client.correo = correo;
    if (telefono) client.telefono = telefono;
    if (direccion) client.direccion = direccion;
    if (departamento) client.departamento = departamento;
    if (ciudad) client.ciudad = ciudad;
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
    res.status(500).json({
      message: "Error al actualizar el cliente, intente nuevamente.",
      error,
    });
  }
};

// Agregar una nueva dirección a un cliente
export const addDireccion = async (req, res) => {
  const { id } = req.params;
  const { tipo, calle, ciudad, departamento, codigoPostal, esPrincipal } =
    req.body;

  try {
    // Buscar el cliente por ID
    const client = await Clients.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Si la nueva dirección es principal, quitar la marca de principal de todas las demás
    if (esPrincipal) {
      client.direcciones.forEach((dir) => {
        dir.esPrincipal = false;
      });
    }

    // Crear la nueva dirección
    const nuevaDireccion = {
      tipo,
      calle,
      ciudad,
      departamento,
      codigoPostal,
      esPrincipal: esPrincipal || false,
    };

    // Agregar la dirección al array
    client.direcciones.push(nuevaDireccion);

    // Si es la dirección principal, actualizar también los campos principales
    if (esPrincipal) {
      client.direccion = calle;
      client.ciudad = ciudad;
      client.departamento = departamento;
    }

    // Guardar los cambios
    await client.save();

    res.status(200).json({
      message: "Dirección agregada exitosamente.",
      direcciones: client.direcciones,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al agregar la dirección, intente nuevamente.",
      error,
    });
  }
};

// Actualizar una dirección existente
export const updateDireccion = async (req, res) => {
  const { id, direccionId } = req.params;
  const { tipo, calle, ciudad, departamento, codigoPostal, esPrincipal } =
    req.body;

  try {
    // Buscar el cliente por ID
    const client = await Clients.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Buscar la dirección en el array
    const direccionIndex = client.direcciones.findIndex(
      (dir) => dir._id.toString() === direccionId
    );

    if (direccionIndex === -1) {
      return res.status(404).json({ message: "Dirección no encontrada." });
    }

    // Si la dirección actualizada será principal, quitar la marca de principal de todas las demás
    if (esPrincipal) {
      client.direcciones.forEach((dir) => {
        dir.esPrincipal = false;
      });
    }

    // Actualizar la dirección
    if (tipo) client.direcciones[direccionIndex].tipo = tipo;
    if (calle) client.direcciones[direccionIndex].calle = calle;
    if (ciudad) client.direcciones[direccionIndex].ciudad = ciudad;
    if (departamento)
      client.direcciones[direccionIndex].departamento = departamento;
    if (codigoPostal !== undefined)
      client.direcciones[direccionIndex].codigoPostal = codigoPostal;
    if (esPrincipal !== undefined)
      client.direcciones[direccionIndex].esPrincipal = esPrincipal;

    // Si la dirección es principal, actualizar también los campos principales
    if (esPrincipal) {
      client.direccion = client.direcciones[direccionIndex].calle;
      client.ciudad = client.direcciones[direccionIndex].ciudad;
      client.departamento = client.direcciones[direccionIndex].departamento;
    }

    // Guardar los cambios
    await client.save();

    res.status(200).json({
      message: "Dirección actualizada exitosamente.",
      direcciones: client.direcciones,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al actualizar la dirección, intente nuevamente.",
      error,
    });
  }
};

// Eliminar una dirección
export const deleteDireccion = async (req, res) => {
  const { id, direccionId } = req.params;

  try {
    // Buscar el cliente por ID
    const client = await Clients.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Buscar la dirección en el array
    const direccionIndex = client.direcciones.findIndex(
      (dir) => dir._id.toString() === direccionId
    );

    if (direccionIndex === -1) {
      return res.status(404).json({ message: "Dirección no encontrada." });
    }

    // Verificar si es la dirección principal
    const esPrincipal = client.direcciones[direccionIndex].esPrincipal;

    // Eliminar la dirección
    client.direcciones.splice(direccionIndex, 1);

    // Si era la dirección principal y aún hay direcciones, establecer la primera como principal
    if (esPrincipal && client.direcciones.length > 0) {
      client.direcciones[0].esPrincipal = true;
      client.direccion = client.direcciones[0].calle;
      client.ciudad = client.direcciones[0].ciudad;
      client.departamento = client.direcciones[0].departamento;
    } else if (client.direcciones.length === 0) {
      // Si no quedan direcciones, establecer valores por defecto
      client.direccion = "Sin dirección";
      client.ciudad = "Sin ciudad";
      client.departamento = "Sin departamento";
    }

    // Guardar los cambios
    await client.save();

    res.status(200).json({
      message: "Dirección eliminada exitosamente.",
      direcciones: client.direcciones,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al eliminar la dirección, intente nuevamente.",
      error,
    });
  }
};

// Agregar un nuevo método de pago
export const addMetodoPago = async (req, res) => {
  const { id } = req.params;
  const { tipo, titular, numeroTarjeta, fechaExpiracion, esPrincipal } =
    req.body;

  try {
    // Buscar el cliente por ID
    const client = await Clients.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Si el nuevo método es principal, quitar la marca de principal de todos los demás
    if (esPrincipal) {
      client.metodosPago.forEach((metodo) => {
        metodo.esPrincipal = false;
      });
    }

    // Crear el nuevo método de pago
    const nuevoMetodo = {
      tipo,
      titular,
      numeroTarjeta,
      fechaExpiracion,
      esPrincipal: esPrincipal || false,
    };

    // Agregar el método al array
    client.metodosPago.push(nuevoMetodo);

    // Guardar los cambios
    await client.save();

    res.status(200).json({
      message: "Método de pago agregado exitosamente.",
      metodosPago: client.metodosPago,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al agregar el método de pago, intente nuevamente.",
      error,
    });
  }
};

// Actualizar un método de pago existente
export const updateMetodoPago = async (req, res) => {
  const { id, metodoPagoId } = req.params;
  const { tipo, titular, numeroTarjeta, fechaExpiracion, esPrincipal } =
    req.body;

  try {
    // Buscar el cliente por ID
    const client = await Clients.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Buscar el método de pago en el array
    const metodoPagoIndex = client.metodosPago.findIndex(
      (metodo) => metodo._id.toString() === metodoPagoId
    );

    if (metodoPagoIndex === -1) {
      return res.status(404).json({ message: "Método de pago no encontrado." });
    }

    // Si el método actualizado será principal, quitar la marca de principal de todos los demás
    if (esPrincipal) {
      client.metodosPago.forEach((metodo) => {
        metodo.esPrincipal = false;
      });
    }

    // Actualizar el método de pago
    if (tipo) client.metodosPago[metodoPagoIndex].tipo = tipo;
    if (titular) client.metodosPago[metodoPagoIndex].titular = titular;
    if (numeroTarjeta)
      client.metodosPago[metodoPagoIndex].numeroTarjeta = numeroTarjeta;
    if (fechaExpiracion)
      client.metodosPago[metodoPagoIndex].fechaExpiracion = fechaExpiracion;
    if (esPrincipal !== undefined)
      client.metodosPago[metodoPagoIndex].esPrincipal = esPrincipal;

    // Guardar los cambios
    await client.save();

    res.status(200).json({
      message: "Método de pago actualizado exitosamente.",
      metodosPago: client.metodosPago,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al actualizar el método de pago, intente nuevamente.",
      error,
    });
  }
};

// Eliminar un método de pago
export const deleteMetodoPago = async (req, res) => {
  const { id, metodoPagoId } = req.params;

  try {
    // Buscar el cliente por ID
    const client = await Clients.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Buscar el método de pago en el array
    const metodoPagoIndex = client.metodosPago.findIndex(
      (metodo) => metodo._id.toString() === metodoPagoId
    );

    if (metodoPagoIndex === -1) {
      return res.status(404).json({ message: "Método de pago no encontrado." });
    }

    // Verificar si es el método principal
    const esPrincipal = client.metodosPago[metodoPagoIndex].esPrincipal;

    // Eliminar el método de pago
    client.metodosPago.splice(metodoPagoIndex, 1);

    // Si era el método principal y aún hay métodos, establecer el primero como principal
    if (esPrincipal && client.metodosPago.length > 0) {
      client.metodosPago[0].esPrincipal = true;
    }

    // Guardar los cambios
    await client.save();

    res.status(200).json({
      message: "Método de pago eliminado exitosamente.",
      metodosPago: client.metodosPago,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Error al eliminar el método de pago, intente nuevamente.",
      error,
    });
  }
};
