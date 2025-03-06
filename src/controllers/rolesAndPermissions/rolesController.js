import Roles from "../../models/rolesAndPermissions/rolesModel.js";
import Usuarios from "../../models/users/userModel.js";
import {
  rolesSchema,
  updateRolesSchema,
} from "../../middlewares/rolesAndPermissions/rolesValidations.js";

// Registrar un nuevo rol
export const newRol = async (req, res) => {
  try {
    // Validar datos con ZOD
    const validationResult = rolesSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors });
    }

    const nuevoRol = new Roles(req.body);
    await nuevoRol.save();

    res.status(201).json({
      message: "Rol creado exitosamente",
      data: nuevoRol,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del rol ya está en uso" });
    }
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener todos los roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Roles.find().populate("permisos", "nombre");
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los roles" });
  }
};

// Obtener un rol por el nombre
export const getRolByName = async (req, res) => {
  const { nombre } = req.params;
  try {
    const rol = await Roles.findOne({ nombre }).populate("permisos", "nombre");
    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }
    res.json(rol);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el rol" });
  }
};

// Actualizar rol
export const updateRol = async (req, res) => {
  const { nombre } = req.params;
  try {
    updateRolesSchema.safeParse(req.body);

    const rol = await Roles.findOneAndUpdate({ nombre }, req.body, {
      new: true,
    });

    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.json({
      message: "Rol actualizado exitosamente",
      data: rol,
    });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Cambiar el estado de un rol
export const updateStateRol = async (req, res) => {
  const { nombre } = req.params;
  try {
    const rol = await Roles.findOne({ nombre });
    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    // Validación para no poder desactivar un rol asignado a un usuario
    const usuarioConRol = await Usuarios.findOne({ rol: rol._id });

    if (usuarioConRol) {
      return res.status(400).json({
        error:
          "No se puede desactivar el rol porque está asignado a un usuario",
      });
    }

    // Alternar estado entre Activo o Inactivo
    rol.estado = rol.estado === "Activo" ? "Inactivo" : "Activo";
    await rol.save();

    res.json({
      message: `Cambio de estado exitosamente`,
      data: rol,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar el estado de el rol" });
  }
};
