import LogAuditoria from "../models/logsModel/LogAudit.js";

// Obtener las notificaciones (logs) del usuario autenticado
export const obtenerNotificacionesUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Obtener los últimos 50 logs del usuario
    const notificaciones = await LogAuditoria.find({ usuario: usuarioId })
      .sort({ fecha: -1 })
      .limit(50);

    return res.json({
      ok: true,
      notificaciones,
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener notificaciones. Contacte al administrador.",
    });
  }
};

// Marcar notificaciones como leídas (opcional - para implementación futura)
export const marcarNotificacionesLeidas = async (req, res) => {
  // Implementación futura para marcar notificaciones como leídas
  res.json({
    ok: true,
    msg: "Notificaciones marcadas como leídas",
  });
};

// Obtener contador de notificaciones nuevas
export const obtenerContadorNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const fechaUltimaRevision =
      req.usuario.ultimaRevisionNotificaciones || new Date(0);

    // Contar notificaciones nuevas desde la última revisión
    const contador = await LogAuditoria.countDocuments({
      usuario: usuarioId,
      fecha: { $gt: fechaUltimaRevision },
    });

    return res.json({
      ok: true,
      contador,
    });
  } catch (error) {
    console.error("Error al obtener contador de notificaciones:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener contador de notificaciones.",
    });
  }
};
