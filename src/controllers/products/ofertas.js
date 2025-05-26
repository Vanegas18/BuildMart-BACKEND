// src/controllers/products/ofertas.js
import cron from "node-cron";
import Productos from "../../models/products/productModel.js";

export const procesarOfertas = cron.schedule(
  "*/1 * * * *",
  async () => {
    const ahora = new Date();
    console.log(`[OfertaJob] 🔥 corriendo a las ${ahora.toISOString()}`);

    // 1) ACTIVAR ofertas cuyo inicio ya pasó y aún no están activas
    const porActivar = await Productos.find({
      "oferta.activa": false,
      "oferta.fechaInicio": { $lte: ahora },
    });
    for (const p of porActivar) {
      p.oferta.activa = true;
      await p.save();
    }

    // 2) DESACTIVAR ofertas vencidas
    const vencidas = await Productos.find({
      "oferta.activa": true,
      "oferta.fechaFin": { $lte: ahora },
    });
    for (const p of vencidas) {
      p.oferta.activa = false;
      await p.save();
    }
  },
  {
    scheduled: false,
    timezone: "America/Bogota",
  }
);
