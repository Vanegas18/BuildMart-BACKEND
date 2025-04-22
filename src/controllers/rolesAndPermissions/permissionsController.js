import Permisos from "../../models/rolesAndPermissions/permissionsModel.js";
import Rol from "../../models/rolesAndPermissions/rolesModel.js";
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

    // Verificar si ya existe un grupo con el mismo nombre (que no sea el que estamos editando)
    if (req.body.nombreGrupo) {
      const grupoExistente = await Permisos.findOne({
        nombreGrupo: req.body.nombreGrupo,
        nombreGrupo: { $ne: nombreGrupo.trim() }, // Excluir el grupo actual de la búsqueda
      });

      if (grupoExistente) {
        return res.status(400).json({
          error: "Ya existe un grupo de permisos con este nombre",
        });
      }
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
    const grupoPermiso = await Permisos.findOne({ nombreGrupo });

    if (!grupoPermiso) {
      return res.status(404).json({ error: "Grupo de permisos no encontrado" });
    }

    // Obtener estado actual para el cambio
    const estadoActual = grupoPermiso.estado;
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";

    // Si vamos a desactivar (cambiar de Activo a Inactivo)
    if (estadoActual === "Activo") {
      // 1. Verificar si es un grupo de permisos crítico
      const gruposCriticos = [
        "Gestión de Usuarios",
        "Gestión de Roles",
        "Gestión de Acceso",
      ];

      // 1. Verificar si es un grupo de permisos crítico
      if (gruposCriticos.includes(nombreGrupo)) {
        return res.status(403).json({
          error:
            "No se puede desactivar este grupo de permisos porque es crítico para la operación del sistema",
          grupoCritico: true,
        });
      }

      // 2. Obtener roles que utilizan este grupo de permisos
      const roles = await Rol.find({}).select("nombre descripcion permisos");
      const rolesAfectados = roles.filter((rol) =>
        rol.permisos.some(
          (p) => p._id.toString() === grupoPermiso._id.toString()
        )
      );

      // 3. Verificar permisos mínimos para roles administrativos
      const rolesAdministrativos = ["Administrador", "SuperAdmin"];
      const rolesEnRiesgo = [];

      for (const rol of rolesAfectados) {
        if (rolesAdministrativos.includes(rol.nombre)) {
          // Verificar que el rol mantenga suficientes permisos críticos
          const permisosRestantes = rol.permisos.filter(
            (p) =>
              p._id.toString() !== grupoPermiso._id.toString() &&
              p.estado === "Activo"
          );

          // Verificar que aún tenga permisos de gestión básica
          const tieneGestionBasica = permisosRestantes.some((p) =>
            ["Gestión de Roles", "Gestión de Acceso"].includes(p.nombreGrupo)
          );

          if (!tieneGestionBasica) {
            rolesEnRiesgo.push(rol.nombre);
          }
        }
      }

      if (rolesEnRiesgo.length > 0) {
        return res.status(403).json({
          error:
            "No se puede desactivar este grupo de permisos porque dejaría roles administrativos sin permisos esenciales",
          rolesAfectados: rolesEnRiesgo,
        });
      }

      // Cambiar el estado del grupo completo
      grupoPermiso.estado = nuevoEstado;
      await grupoPermiso.save();

      // Responder con información sobre el impacto
      res.json({
        message: `Cambio de estado exitoso`,
        data: grupoPermiso,
        impacto: {
          rolesAfectados: rolesAfectados.map((rol) => ({
            nombre: rol.nombre,
            descripcion: rol.descripcion,
          })),
        },
        // Información para restauración
        restauracion: {
          grupoPermiso: nombreGrupo,
          estadoAnterior: estadoActual,
        },
      });
    } else {
      // Si estamos activando (cambio de Inactivo a Activo), no necesitamos validaciones
      grupoPermiso.estado = nuevoEstado;
      await grupoPermiso.save();

      res.json({
        message: `Grupo de permisos activado exitosamente`,
        data: grupoPermiso,
      });
    }
  } catch (error) {
    console.error("Error al cambiar estado del permiso:", error);
    res.status(500).json({
      error: "Error al cambiar el estado del permiso",
    });
  }
};
