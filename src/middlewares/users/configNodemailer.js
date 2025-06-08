import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

// CONFIGURACIÓN NODEMAILER
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.userGmail,
    pass: process.env.passAppGmail,
  },
});

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

// Función para generar HTML dinámico del correo según el rol
export const generarHtmlCorreo = (nombreRol) => {
  const baseUrl = process.env.BASE_URL || "https://build-two-sage.vercel.app";
  const resetUrl = `${baseUrl}/`;

  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Bienvenido a <span style="color: #007bff;">Build Mart</span> 🎉</h2>
        <p style="color: #555; font-size: 16px;">
          ¡Su registro fue exitoso! 
          ${
            nombreRol === "Administrador"
              ? "Para gestionar la plataforma, inicie sesión y configure sus preferencias. Además, le recomendamos cambiar su contraseña:"
              : "Gracias por registrarse en nuestra tienda. ¡Esperamos que disfrute su experiencia con nosotros!"
          }
        </p>
        
        ${
          nombreRol === "Administrador"
            ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" target="_blank" style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
            🔐 Cambiar Contraseña
          </a>
        </div>`
            : ""
        }

        <p style="color: #777; font-size: 14px; text-align: center;">
          Si no ha solicitado este registro, ignore este mensaje.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Build Mart. Todos los derechos reservados.
        </p>
      </div>
    `;
};

export const enviarCorreoRegistro = async (emailDestino, rol) => {
  try {
    const { userGmail } = process.env;
    const htmlCorreo = generarHtmlCorreo(rol);

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: emailDestino,
      subject: `🎉 Build Mart - Registro Exitoso`,
      html: htmlCorreo,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado a ${emailDestino}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`❌ Error al enviar el correo a ${emailDestino}:`, error);
    throw error;
  }
};

// Generar el token JWT para recuperación de contraseña
export const generarTokenRecuperacion = (usuarioId, correo) => {
  const secretKey = process.env.JWT_SECRET || "tu_clave_secreta";

  // Generar token válido por 1 hora (3600 segundos)
  return jwt.sign(
    {
      id: usuarioId,
      correo,
      tipo: "recuperacion", // Para identificar que es un token de recuperación
    },
    secretKey,
    { expiresIn: "1h" }
  );
};

// Generar el HTML para el correo de solicitud de cambio de contraseña
export const generarHtmlRecuperacion = (token) => {
  const baseUrl = process.env.BASE_URL || "https://build-two-sage.vercel.app";
  const resetUrl = `${baseUrl}/restablecer-contrasena?token=${token}`;

  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: al1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Recuperación de Contraseña en <span style="color: #007bff;">Build Mart</span> 🔑</h2>
        <p style="color: #555; font-size: 16px; text-align: center;">
          Hemos recibido una solicitud para restablecer su contraseña. Haga clic en el siguiente botón para crear una nueva contraseña:
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" target="_blank" style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
            🔐 Restablecer Contraseña
          </a>
        </div>

        <p style="color: #777; font-size: 14px; text-align: center;">
          Este enlace expirará en 1 hora. Si no solicitó restablecer su contraseña, puede ignorar este correo.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Build Mart. Todos los derechos reservados.
        </p>
      </div>
    `;
};

// Función para enviar el correo de recuperación
export const enviarCorreoRecuperacion = async (emailDestino, token) => {
  if (!emailDestino) {
    throw new Error("El email del destinatario es obligatorio");
  }

  if (!token) {
    throw new Error("El token de recuperación es obligatorio");
  }

  try {
    const { userGmail } = process.env;
    const htmlCorreo = generarHtmlRecuperacion(token);

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: emailDestino,
      subject: `🔑 Build Mart - Recuperación de Contraseña`,
      html: htmlCorreo,
      text: `Hemos recibido una solicitud para restablecer su contraseña en Build Mart. Por favor visite ${
        process.env.BASE_URL || "https://build-two-sage.vercel.app"
      }/restablecer-contrasena?token=${token} para crear una nueva contraseña. Este enlace expirará en 1 hora.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Correo de recuperación enviado a ${emailDestino}: ${info.messageId}`
    );
    return info;
  } catch (error) {
    console.error(
      `❌ Error al enviar el correo de recuperación a ${emailDestino}:`,
      error
    );
    throw error;
  }
};

// Función para enviar el correo de confirmación después de cambiar la contraseña
export const enviarCorreoConfirmacionCambio = async (emailDestino) => {
  if (!emailDestino) {
    throw new Error("El email del destinatario es obligatorio");
  }

  try {
    const { userGmail } = process.env;
    const baseUrl = process.env.BASE_URL || "https://build-two-sage.vercel.app";
    const loginUrl = `${baseUrl}/login`;

    const htmlCorreo = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Contraseña Actualizada en <span style="color: #007bff;">Build Mart</span> 🔐</h2>
          <p style="color: #555; font-size: 16px; text-align: center;">
            Su contraseña ha sido actualizada correctamente. Ahora puede iniciar sesión con su nueva contraseña.
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${loginUrl}" target="_blank" style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
              🔐 Iniciar Sesión
            </a>
          </div>

          <p style="color: #777; font-size: 14px; text-align: center;">
            Si no ha solicitado este cambio, contacte con soporte inmediatamente.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Build Mart. Todos los derechos reservados.
          </p>
        </div>
      `;

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: emailDestino,
      subject: `✅ Build Mart - Contraseña Actualizada`,
      html: htmlCorreo,
      text: `Su contraseña en Build Mart ha sido actualizada correctamente. Ahora puede iniciar sesión con su nueva contraseña.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Correo de confirmación enviado a ${emailDestino}: ${info.messageId}`
    );
    return info;
  } catch (error) {
    console.error(
      `❌ Error al enviar el correo de confirmación a ${emailDestino}:`,
      error
    );
    throw error;
  }
};

// Función para generar HTML dinámico del correo de confirmación de pedido
export const generarHtmlCorreoPedido = (order, usuario) => {
  const baseUrl = process.env.BASE_URL || "https://build-two-sage.vercel.app";
  const orderUrl = `${baseUrl}/orders/${order._id}`;

  // Convertir a string y usar substring
  const clienteNombre = usuario?.nombre || usuario?.nombreNegocio || "Cliente";

  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">¡Gracias por tu pedido en <span style="color: #007bff;">Build Mart</span>! 🛒</h2>
        
        <p style="color: #555; font-size: 16px;">
          Hola ${clienteNombre},
          
          Hemos recibido tu pedido correctamente y está siendo procesado.
        </p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Resumen de tu pedido:</h3>
          <ul style="padding-left: 20px; color: #555;">
            ${order.items
              .map((item) => {
                // Construir el HTML del item
                let itemHtml = `
                    <li style="margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <strong>${item.productoId?.nombre}</strong> x ${item.cantidad}
                  `;

                // Si es una oferta, mostrar precios especiales
                if (item.enOferta) {
                  itemHtml += `
                          <div style="margin-top: 4px;">
                            <span style="color: #dc3545; font-weight: bold;">🏷️ EN OFERTA</span>
                            ${
                              item.descuento > 0
                                ? `<span style="color: #28a745; font-size: 12px; margin-left: 8px;">${item.infoOferta.descuento}% OFF</span>`
                                : ""
                            }
                          </div>
                          <div style="margin-top: 2px; font-size: 12px;">
                            <span style="text-decoration: line-through; color: #999;">
                              Precio normal: ${formatearPrecio(
                                item.precioOriginal
                              )} c/u
                            </span>
                          </div>
                          <div style="color: #dc3545; font-weight: bold; font-size: 14px;">
                            Precio oferta: ${formatearPrecio(item.precio)} c/u
                          </div>
                    `;
                } else {
                  itemHtml += `
                          <div style="margin-top: 4px; font-size: 14px;">
                            Precio: ${formatearPrecio(item.precio)} c/u
                          </div>
                    `;
                }

                itemHtml += `
                        </div>
                        <div style="text-align: right; font-weight: bold; color: #333;">
                          ${formatearPrecio(item.subtotal)}
                        </div>
                      </div>
                    </li>
                  `;

                return itemHtml;
              })
              .join("")}
          </ul>
          
          <!-- Mostrar resumen de ahorros si hay ofertas -->
          ${(() => {
            const itemsConOferta = order.items.filter((item) => item.esOferta);
            if (itemsConOferta.length > 0) {
              const totalSinOferta = order.items.reduce(
                (sum, item) => sum + item.precioOriginal * item.cantidad,
                0
              );
              const ahorroTotal = totalSinOferta - order.subtotal;

              return `
                <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 10px; margin: 15px 0;">
                  <div style="color: #155724; font-weight: bold; text-align: center;">
                    🎉 ¡Felicitaciones! Has ahorrado ${formatearPrecio(
                      ahorroTotal
                    )} con nuestras ofertas
                  </div>
                  <div style="font-size: 12px; color: #155724; text-align: center; margin-top: 5px;">
                    Subtotal sin ofertas: <span style="text-decoration: line-through;">${formatearPrecio(
                      totalSinOferta
                    )}</span>
                  </div>
                </div>
              `;
            }
            return "";
          })()}
          
          <!-- Desglose de precios con IVA y domicilio -->
            
            <div style="border-top: 1px solid #ddd; padding-top: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: bold; font-size: 18px; color: #333;">Total a pagar:</span>
                <span style="color: #007bff; font-weight: bold; font-size: 20px;">
                  ${formatearPrecio(order.subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">📋 Estado del pedido:</h4>
          <p style="color: #856404; margin: 0;">
            Tu pedido está actualmente en estado: <strong>PENDIENTE</strong>
          </p>
          <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">
            Te notificaremos cuando cambie el estado de tu pedido.
          </p>
        </div>
        
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${orderUrl}" 
            style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Ver detalles del pedido
          </a>
        </div>
        
        <p style="color: #555; font-size: 16px;">
          Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Build Mart. Todos los derechos reservados.
        </p>
      </div>
    `;
};

// Función para enviar correo de confirmación de pedido
export const enviarCorreoPedido = async (order, usuario) => {
  try {
    const { userGmail } = process.env;
    const htmlCorreo = generarHtmlCorreoPedido(order, usuario);

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: usuario.correo,
      subject: `🛒 Build Mart - Confirmación de Pedido #${order.pedidoId}`,
      html: htmlCorreo,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Correo de confirmación de pedido enviado a ${usuario.correo}: ${info.response}`
    );
    return info;
  } catch (error) {
    console.error(
      `❌ Error al enviar el correo de confirmación de pedido a ${usuario.email}:`,
      error
    );
    throw error;
  }
};

// 2. Función para enviar correo de configuración a administradores
export const enviarCorreoConfiguracionAdmin = async (
  emailDestino,
  usuarioId
) => {
  try {
    const { userGmail } = process.env;

    // Generar token para el administrador
    const token = generarTokenRecuperacion(usuarioId, emailDestino);

    // Usamos tu función existente pero con un mensaje adaptado para administradores
    const baseUrl =
      process.env.BASE_URL || "https://build-two-sage.vercel.app/login";
    const resetUrl = `${baseUrl}/restablecer-contrasena?token=${token}`;

    const htmlCorreo = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Bienvenido a <span style="color: #007bff;">Build Mart</span> 🏗️</h2>
          <p style="color: #555; font-size: 16px; text-align: center;">
            Has sido registrado como <strong>Administrador</strong> en nuestra plataforma.
          </p>
          <p style="color: #555; font-size: 16px; text-align: center;">
            Para completar tu registro y establecer tu contraseña, por favor haz clic en el siguiente botón:
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" target="_blank" style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
              🔐 Configurar mi contraseña
            </a>
          </div>

          <p style="color: #777; font-size: 14px; text-align: center;">
            Este enlace expirará en 24 horas. Si no configuras tu cuenta en este tiempo, deberás solicitar un nuevo enlace.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Build Mart. Todos los derechos reservados.
          </p>
        </div>
      `;

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: emailDestino,
      subject: `🔐 Build Mart - Configura tu cuenta de Administrador`,
      html: htmlCorreo,
      text: `Has sido registrado como Administrador en Build Mart. Por favor visita ${resetUrl} para configurar tu contraseña. Este enlace expirará en 24 horas.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Correo de configuración enviado a ${emailDestino}: ${info.messageId}`
    );
    return info;
  } catch (error) {
    console.error(
      `❌ Error al enviar el correo de configuración a ${emailDestino}:`,
      error
    );
    throw error;
  }
};

export const generarHtmlCambioEstadoPedido = (order, nuevoEstado, usuario) => {
  const baseUrl = process.env.BASE_URL || "https://build-two-sage.vercel.app";
  const orderUrl = `${baseUrl}/orders/${order._id}`;
  const clienteNombre = usuario?.nombre || usuario?.nombreNegocio || "Cliente";

  // Configuración de estados con colores y mensajes
  const estadosConfig = {
    confirmado: {
      color: "#28a745",
      emoji: "✅",
      titulo: "¡Tu pedido ha sido confirmado!",
      mensaje:
        "Hemos confirmado tu pedido y pronto comenzaremos con el proceso de preparación.",
      accion: "Tu pedido será procesado y convertido en una venta.",
    },
    rechazado: {
      color: "#dc3545",
      emoji: "❌",
      titulo: "Tu pedido ha sido rechazado",
      mensaje:
        "Lamentamos informarte que no pudimos procesar tu pedido en este momento.",
      accion: "El stock de los productos ha sido restaurado automáticamente.",
    },
  };

  const config = estadosConfig[nuevoEstado];

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: ${config.color}; text-align: center;">
        ${config.emoji} ${config.titulo}
      </h2>
      
      <p style="color: #555; font-size: 16px;">
        Hola ${clienteNombre},
      </p>
      
      <p style="color: #555; font-size: 16px;">
        ${config.mensaje}
      </p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${
        config.color
      };">
        <h3 style="color: ${
          config.color
        }; margin-top: 0;">📋 Información del pedido:</h3>
        <p><strong>Pedido ID:</strong> #${order.pedidoId}</p>
        <p><strong>Estado:</strong> <span style="color: ${
          config.color
        }; font-weight: bold; text-transform: uppercase;">${nuevoEstado}</span></p>
        <p><strong>Total:</strong> ${formatearPrecio(order.subtotal)}</p>
        <p style="margin-bottom: 0;"><strong>Fecha:</strong> ${new Date(
          order.createdAt
        ).toLocaleDateString("es-CO")}</p>
      </div>

      <div style="background-color: ${
        nuevoEstado === "confirmado" ? "#d4edda" : "#f8d7da"
      }; 
                  border: 1px solid ${
                    nuevoEstado === "confirmado" ? "#c3e6cb" : "#f5c6cb"
                  }; 
                  border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="color: ${
          nuevoEstado === "confirmado" ? "#155724" : "#721c24"
        }; margin: 0; font-weight: bold;">
          ${config.emoji} ${config.accion}
        </p>
        ${
          nuevoEstado === "confirmado"
            ? `
          <p style="color: #155724; margin: 8px 0 0 0; font-size: 14px;">
            Recibirás otra notificación cuando tu venta cambie de estado (enviado, entregado, etc.).
          </p>
        `
            : `
          <p style="color: #721c24; margin: 8px 0 0 0; font-size: 14px;">
            Si tienes alguna pregunta sobre el rechazo de tu pedido, no dudes en contactarnos.
          </p>
        `
        }
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${orderUrl}" 
          style="background-color: ${
            config.color
          }; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Ver detalles del pedido
        </a>
      </div>
      
      <p style="color: #555; font-size: 14px; text-align: center;">
        Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Build Mart. Todos los derechos reservados.
      </p>
    </div>
  `;
};

export const generarHtmlCambioEstadoVenta = (venta, nuevoEstado, usuario) => {
  const baseUrl = process.env.BASE_URL || "https://build-two-sage.vercel.app";
  const ventaUrl = `${baseUrl}/sales/${venta._id}`;
  const clienteNombre = usuario?.nombre || usuario?.nombreNegocio || "Cliente";

  // Configuración de estados con colores y mensajes
  const estadosConfig = {
    procesando: {
      color: "#ffc107",
      emoji: "⏳",
      titulo: "Tu pedido está siendo procesado",
      mensaje: "Hemos comenzado a preparar tu pedido.",
      accion: "Estamos verificando el inventario y preparando los productos.",
    },
    enviado: {
      color: "#17a2b8",
      emoji: "🚚",
      titulo: "¡Tu pedido ha sido enviado!",
      mensaje: "Tu pedido está en camino hacia la dirección de entrega.",
      accion: "Pronto recibirás tu pedido en la dirección especificada.",
    },
    entregado: {
      color: "#28a745",
      emoji: "📦",
      titulo: "¡Tu pedido ha sido entregado!",
      mensaje: "Tu pedido ha sido entregado exitosamente.",
      accion: "Esperamos que disfrutes de tu compra.",
    },
    completado: {
      color: "#28a745",
      emoji: "✅",
      titulo: "¡Venta completada!",
      mensaje: "Tu compra ha sido completada exitosamente.",
      accion: "Gracias por elegirnos. ¡Esperamos verte pronto!",
    },
    reembolsado: {
      color: "#dc3545",
      emoji: "↩️",
      titulo: "Tu compra ha sido reembolsada",
      mensaje: "Hemos procesado el reembolso de tu compra.",
      accion:
        "El stock de los productos ha sido restaurado y el reembolso será procesado.",
    },
  };

  const config = estadosConfig[nuevoEstado];

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: ${config.color}; text-align: center;">
        ${config.emoji} ${config.titulo}
      </h2>
      
      <p style="color: #555; font-size: 16px;">
        Hola ${clienteNombre},
      </p>
      
      <p style="color: #555; font-size: 16px;">
        ${config.mensaje}
      </p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${
        config.color
      };">
        <h3 style="color: ${
          config.color
        }; margin-top: 0;">📋 Información de la venta:</h3>
        <p><strong>Venta ID:</strong> #${
          venta.ventaId || venta._id.toString().slice(-8).toUpperCase()
        }</p>
        ${
          venta.pedidoId
            ? `<p><strong>Pedido relacionado:</strong> #${venta.pedidoId}</p>`
            : ""
        }
        <p><strong>Estado:</strong> <span style="color: ${
          config.color
        }; font-weight: bold; text-transform: uppercase;">${nuevoEstado}</span></p>
        <p><strong>Total:</strong> ${formatearPrecio(venta.subtotal)}</p>
        <p style="margin-bottom: 0;"><strong>Fecha:</strong> ${new Date(
          venta.createdAt
        ).toLocaleDateString("es-CO")}</p>
      </div>

      <!-- Mostrar productos si es necesario -->
      ${
        nuevoEstado === "entregado" || nuevoEstado === "completado"
          ? `
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #333; margin-top: 0;">📦 Productos entregados:</h4>
          <ul style="padding-left: 20px; color: #555; margin: 0;">
            ${venta.productos
              .map(
                (producto) => `
              <li style="margin-bottom: 8px;">
                <strong>${
                  producto.productoId?.nombre || "Producto"
                }</strong> x ${producto.cantidad}
                ${
                  producto.enOferta
                    ? '<span style="color: #dc3545; font-size: 12px; margin-left: 8px;">🏷️ OFERTA</span>'
                    : ""
                }
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `
          : ""
      }

      <div style="background-color: ${getBackgroundColor(nuevoEstado)}; 
                  border: 1px solid ${getBorderColor(nuevoEstado)}; 
                  border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="color: ${getTextColor(
          nuevoEstado
        )}; margin: 0; font-weight: bold;">
          ${config.emoji} ${config.accion}
        </p>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${ventaUrl}" 
          style="background-color: ${
            config.color
          }; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Ver detalles de la venta
        </a>
      </div>
      
      <p style="color: #555; font-size: 14px; text-align: center;">
        Si tienes alguna pregunta sobre tu compra, no dudes en contactarnos.
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Build Mart. Todos los derechos reservados.
      </p>
    </div>
  `;
};

// Funciones auxiliares para colores según estado
function getBackgroundColor(estado) {
  const colors = {
    procesando: "#fff3cd",
    enviado: "#d1ecf1",
    entregado: "#d4edda",
    completado: "#d4edda",
    reembolsado: "#f8d7da",
  };
  return colors[estado] || "#f8f9fa";
}

function getBorderColor(estado) {
  const colors = {
    procesando: "#ffeeba",
    enviado: "#bee5eb",
    entregado: "#c3e6cb",
    completado: "#c3e6cb",
    reembolsado: "#f5c6cb",
  };
  return colors[estado] || "#dee2e6";
}

function getTextColor(estado) {
  const colors = {
    procesando: "#856404",
    enviado: "#0c5460",
    entregado: "#155724",
    completado: "#155724",
    reembolsado: "#721c24",
  };
  return colors[estado] || "#495057";
}

export const enviarCorreoCambioEstadoPedido = async (
  order,
  nuevoEstado,
  usuario
) => {
  try {
    const { userGmail } = process.env;
    const htmlCorreo = generarHtmlCambioEstadoPedido(
      order,
      nuevoEstado,
      usuario
    );

    const estadoTitulos = {
      confirmado: "Pedido Confirmado",
      rechazado: "Pedido Rechazado",
    };

    const estadoEmojis = {
      confirmado: "✅",
      rechazado: "❌",
    };

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: usuario.correo,
      subject: `${estadoEmojis[nuevoEstado]} Build Mart - ${estadoTitulos[nuevoEstado]} #${order.pedidoId}`,
      html: htmlCorreo,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Correo de cambio de estado de pedido enviado a ${usuario.correo}: ${info.response}`
    );
    return info;
  } catch (error) {
    console.error(
      `❌ Error al enviar correo de cambio de estado de pedido a ${usuario.correo}:`,
      error
    );
    throw error;
  }
};

// Función para enviar correo de cambio de estado de venta
export const enviarCorreoCambioEstadoVenta = async (
  venta,
  nuevoEstado,
  usuario
) => {
  try {
    const { userGmail } = process.env;
    const htmlCorreo = generarHtmlCambioEstadoVenta(
      venta,
      nuevoEstado,
      usuario
    );

    const estadoTitulos = {
      procesando: "Procesando tu Pedido",
      enviado: "Pedido Enviado",
      entregado: "Pedido Entregado",
      completado: "Compra Completada",
      reembolsado: "Compra Reembolsada",
    };

    const estadoEmojis = {
      procesando: "⏳",
      enviado: "🚚",
      entregado: "📦",
      completado: "✅",
      reembolsado: "↩️",
    };

    const ventaId =
      venta.ventaId || venta._id.toString().slice(-8).toUpperCase();

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: usuario.correo,
      subject: `${estadoEmojis[nuevoEstado]} Build Mart - ${estadoTitulos[nuevoEstado]} #${ventaId}`,
      html: htmlCorreo,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Correo de cambio de estado de venta enviado a ${usuario.correo}: ${info.response}`
    );
    return info;
  } catch (error) {
    console.error(
      `❌ Error al enviar correo de cambio de estado de venta a ${usuario.correo}:`,
      error
    );
    throw error;
  }
};
