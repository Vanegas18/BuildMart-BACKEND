import Permisos from "../../models/rolesAndPermissions/permissionsModel.js";
import {
  permissionsSchema,
  updatePermissionsSchema,
} from "../../middlewares/rolesAndPermissions/permissionsValidations.js";

// Registrar un nuevo permiso
export const newPermissions = async (req, res) => {
  try {
    // Validar datos con Zod
    const permissionsValidate = permissionsSchema.safeParse(req.body);
    if (!permissionsValidate.success) {
      return res.status(400).json({
        error: permissionsValidate.error,
      });
    }

    // Crear y guardar el nuevo permiso
    const permiso = new Permisos(req.body);
    await permiso.save();

    // Responder con éxito y datos de la categoría creada
    res.status(201).json({
      message: "Permiso creado exitosamente",
      data: permiso,
    });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del permiso ya está en uso" });
    }
    // Manejar otros errores
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
    // Validar datos de actualización con Zod
    const updatePermissionsValidate = updatePermissionsSchema.safeParse(
      req.body
    );
    if (!updatePermissionsValidate.success) {
      return res.status(400).json({
        error: updatePermissionsValidate.error,
      });
    }

    // Actualizar el permiso
    const permiso = await Permisos.findOneAndUpdate(
      { nombre: nombre.trim() },
      req.body,
      {
        new: true,
      } // Devuelve el documento actualizado
    );

    if (!permiso) {
      return res.status(404).json({ error: "Permiso no encontrado" });
    }

    // Responder con éxito y datos actualizados
    res.json({
      message: "Permiso actualizado exitosamente",
      data: permiso,
    });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del permiso ya está en uso" });
    }
    // Manejar otros errores
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Actualizar estado de un permiso
export const updateStatePermissions = async (req, res) => {
  const { nombre } = req.params;
  try {
    // Buscar el permiso por nombre
    const permiso = await Permisos.findOne({ nombre: nombre.trim() });

    if (!permiso) {
      return res.status(404).json({ error: "Permiso no encontrado" });
    }

    // Alternar el estado entre "Activo" e "Inactivo"
    permiso.estado = permiso.estado === "Activo" ? "Inactivo" : "Activo";

    // Guarda el permiso
    await permiso.save();

    // Responder con éxito y datos actualizados
    res.json({
      message: `Cambio de estado exitoso`,
      data: permiso,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar el estado de el permiso" });
  }
};
