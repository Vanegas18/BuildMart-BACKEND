import Permisos from "../../models/rolesAndPermissions/permissionsModel.js";
import {
  permissionsSchema,
  updatePermissionsSchema,
} from "../../middlewares/rolesAndPermissions/permissionsValidations.js";

// Registrar un nuevo permiso
export const newPermissions = async (req, res) => {
  try {
    const permissionsValidate = permissionsSchema.safeParse(req.body);
    if (!permissionsValidate.success) {
      return res.status(400).json({
        error: permissionsValidate.error,
      });
    }

    const permiso = new Permisos(req.body);
    await permiso.save();

    res.status(201).json({
      message: "Permiso creado exitosamente",
      data: permiso,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del permiso ya está en uso" });
    }
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener todos los permisos
export const getPermissions = async (req, res) => {
  try {
    const permisos = await Permisos.find();
    res.json(permisos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los permisos" });
  }
};

// Obtener permiso por el nombre
export const getPermissionsByName = async (req, res) => {
  const { nombre } = req.params;
  try {
    const permiso = await Permisos.findOne({ nombre });
    if (!permiso) {
      return res.status(404).json({ error: "Permiso no encontrado" });
    }
    res.json(permiso);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el permiso" });
  }
};

// Actualizar un permiso
export const updatePermissions = async (req, res) => {
  const { nombre } = req.params;
  try {
    const updatePermissionsValidate = updatePermissionsSchema.safeParse(
      req.body
    );
    if (!updatePermissionsValidate.success) {
      return res.status(400).json({
        error: updatePermissionsValidate.error,
      });
    }

    const permiso = await Permisos.findOneAndUpdate(
      { nombre: nombre.trim() },
      req.body,
      {
        new: true,
      }
    );

    if (!permiso) {
      return res.status(404).json({ error: "Permiso no encontrado" });
    }

    res.json({
      message: "Permiso actualizado exitosamente",
      data: permiso,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del permiso ya está en uso" });
    }
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Actualizar estado de un permiso
export const updateStatePermissions = async (req, res) => {
  const { nombre } = req.params;
  try {
    const permiso = await Permisos.findOne({ nombre: nombre.trim() });

    if (!permiso) {
      return res.status(404).json({ error: "Permiso no encontrado" });
    }

    permiso.estado = permiso.estado === "Activo" ? "Inactivo" : "Activo";
    await permiso.save();

    res.json({
      message: `Cambio de estado exitoso`,
      data: permiso,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar el estado de el permiso" });
  }
};
