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
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
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
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  const resetUrl = `${baseUrl}/restablecer-contrasena?token=${token}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
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
        process.env.BASE_URL || "http://localhost:5173"
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
    const baseUrl = process.env.BASE_URL || "http://localhost:5173";
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
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
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
            .map(
              (item) => `
            <li style="margin-bottom: 8px;">
                ${item.producto.nombre} x ${item.cantidad} - ${formatearPrecio(
                item.precio * item.cantidad
              )}
            </li>
            `
            )
            .join("")}
        </ul>
        <p style="font-weight: bold; margin-top: 15px; color: #333;">
          Total: ${formatearPrecio(order.total)}
        </p>
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
    const baseUrl = process.env.BASE_URL || "http://localhost:5173";
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
