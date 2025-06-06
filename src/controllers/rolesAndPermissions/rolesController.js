import Roles from "../../models/rolesAndPermissions/rolesModel.js";
import Usuarios from "../../models/users/userModel.js";
import Permisos from "../../models/rolesAndPermissions/permissionsModel.js";
import LogAuditoria from "../../models/logsModel/LogAudit.js";
import {
  rolesSchema,
  updateRolesSchema,
} from "../../middlewares/rolesAndPermissions/rolesValidations.js";
import { resolveContent } from "nodemailer/lib/shared/index.js";

// Registrar un nuevo rol
export const newRol = async (req, res) => {
  const { permisos } = req.body;
  try {
    // Validar datos con ZOD
    const rolesValidate = rolesSchema.safeParse(req.body);
    if (!rolesValidate.success) {
      return res.status(400).json({
        error: rolesValidate.error,
      });
    }

    // Verificar que los permisos existan
    if (Array.isArray(permisos)) {
      for (const permisoId of permisos) {
        // Primero verificar si es un ID de grupo
        const grupoPermiso = await Permisos.findById(permisoId);

        if (!grupoPermiso) {
          // Si no es un grupo, buscar si es un ID de permiso individual dentro de algún grupo
          const grupoConPermiso = await Permisos.findOne({
            "permisos._id": permisoId,
          });

          if (!grupoConPermiso) {
            return res
              .status(400)
              .json({ error: `El permiso con ID ${permisoId} no existe` });
          }
        }
      }

      // Si llegamos aquí, todos los IDs son válidos
      // No es necesario procesar los permisos aquí, podemos usar los IDs tal como están
    } else {
      return res
        .status(400)
        .json({ error: "El campo permisos debe ser un array" });
    }

    // Crear y guardar el nuevo rol
    const nuevoRol = new Roles(req.body);
    await nuevoRol.save();

    // Responder con éxito y datos del rol creado
    res.status(201).json({
      message: "Rol creado exitosamente",
      data: nuevoRol,
    });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del rol ya está en uso" });
    }
    // Manejar otros errores
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Obtener todos los roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Roles.find().populate("permisos");
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los roles" });
  }
};

// Obtener un rol por el nombre
export const getRolByName = async (req, res) => {
  const { nombre } = req.params;
  try {
    const rol = await Roles.findOne({ nombre }).populate(
      "permisos",
      "nombreGrupo"
    );
    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }
    res.json(rol);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el rol" });
  }
};

// Obtener un rol por el ID
export const getRolById = async (req, res) => {
  const { id } = req.params;
  try {
    const rol = await Roles.findById(id).populate("permisos");
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
  const { permisos } = req.body;
  try {
    // Validar datos de actualización con Zod
    const updateRolesValidate = updateRolesSchema.safeParse(req.body);
    if (!updateRolesValidate.success) {
      return res.status(400).json({
        error: updateRolesValidate.error,
      });
    }

    // Verificar que los permisos existan
    if (permisos) {
      const permisoExistente = await Permisos.findById(permisos);
      if (!permisoExistente) {
        return res
          .status(400)
          .json({ error: `El permiso con ID ${permisos} no existe` });
      }
    }

    // Obtener el rol antes de actualizarla para el log
    const rolAnterior = await Roles.findOne({ nombre });
    if (!rolAnterior) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    // Actualizar el rol
    const rol = await Roles.findOneAndUpdate(
      { nombre },
      req.body,
      {
        new: true,
      } // Devuelve el documento actualizado
    );

    // Responder con éxito y datos actualizados
    res.json({
      message: "Rol actualizado exitosamente",
      data: rol,
    });
  } catch (error) {
    // Manejar error de duplicación
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre del rol ya está en uso" });
    }
    // Manejar otros errores
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Cambiar el estado de un rol
export const updateStateRol = async (req, res) => {
  const { nombre } = req.params;
  try {
    // Buscar el rol por Nombre
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

    // Guardar estado anterior para el log de auditoría
    const estadoAnterior = rol.estado;

    // Alternar estado entre Activo o Inactivo
    rol.estado = rol.estado === "Activo" ? "Inactivo" : "Activo";

    // Guarda la rol
    await rol.save();

    // Responder con éxito y datos actualizados
    res.json({
      message: `Cambio de estado exitosamente`,
      data: rol,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al cambiar el estado de el rol", error });
  }
};
