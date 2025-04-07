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

    // Verificar si ya existe un grupo con el mismo nombre
    const grupoExistente = await Permisos.findOne({
      nombreGrupo: req.body.nombreGrupo,
    });

    if (grupoExistente) {
      return res.status(400).json({
        error: "Ya existe un grupo de permisos con este nombre",
      });
    }

    // Crear y guardar el nuevo permiso
    const permiso = new Permisos(req.body);
    await permiso.save();

    // Responder con éxito y datos de la categoría creada
    res.status(201).json({
      message: "Grupo de permisos creado exitosamente",
      data: permiso,
    });
  } catch (error) {
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
    res.status(500).json({ error: "Error al obtener los grupos de permisos" });
  }
};

// Obtener permiso por el nombre
export const getPermissionsByName = async (req, res) => {
  const { nombreGrupo } = req.params;
  try {
    const permiso = await Permisos.findOne({ nombreGrupo });
    if (!permiso) {
      return res.status(404).json({ error: "Grupo de permisos no encontrado" });
    }
    res.json(permiso);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el grupo de permisos" });
  }
};

// Actualizar un permiso
export const updatePermissions = async (req, res) => {
  const { nombreGrupo } = req.params;
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

    // Verificar si ya existe un grupo con el mismo nombre
    const grupoExistente = await Permisos.findOne({
      nombreGrupo: req.body.nombreGrupo,
    });

    if (grupoExistente) {
      return res.status(400).json({
        error: "Ya existe un grupo de permisos con este nombre",
      });
    }

    // Actualizar el permiso
    const permiso = await Permisos.findOneAndUpdate(
      { nombreGrupo: nombreGrupo.trim() },
      req.body,
      {
        new: true,
      } // Devuelve el documento actualizado
    );

    if (!permiso) {
      return res.status(404).json({ error: "Grupo de permisos no encontrado" });
    }

    // Responder con éxito y datos actualizados
    res.json({
      message: "Grupo de permisos actualizado exitosamente",
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
  const { nombreGrupo } = req.params;
  try {
    // Buscar el permiso por nombre
    const permiso = await Permisos.findOne({ nombreGrupo });

    if (!permiso) {
      return res.status(404).json({ error: "Grupo de permisos no encontrado" });
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
    res
      .status(500)
      .json({ error: "Error al cambiar el estado del grupo de permisos" });
  }
};

// Activar o desactivar un permiso específico dentro de un grupo
export const togglePermission = async (req, res) => {
  const { nombreGrupo, permisoId } = req.params;
  try {
    const permisosGroup = await Permisos.findOne({ nombreGrupo });

    if (!permisosGroup) {
      return res.status(404).json({ error: "Grupo de permisos no encontrado" });
    }

    // Encontrar el índice del permiso específico
    const permisoIndex = permisosGroup.permisos.findIndex(
      (p) => p._id.toString() === permisoId
    );

    if (permisoIndex === -1) {
      return res.status(404).json({ error: "Permiso no encontrado" });
    }

    // Alternar el estado entre "Activo" e "Inactivo"
    permisosGroup.permisos[permisoIndex].estado =
      permisosGroup.permisos[permisoIndex].estado === "Activo"
        ? "Inactivo"
        : "Activo";

    await permisosGroup.save();

    res.json({
      message: `Permiso ${permisoId} ${permisosGroup.permisos[permisoIndex].estado} exitosamente`,
      data: permisosGroup,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar el estado del permiso" });
  }
};
