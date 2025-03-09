import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// CONFIGURACIÓN NODEMAILER
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.userGmail,
    pass: process.env.passAppGmail,
  },
});

// Función para generar HTML dinámico del correo según el rol
export const generarHtmlCorreo = (nombreRol) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/views/Usuario/usuario.html`;

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

export const generarHtmlRecuperacion = () => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/views/Login.html`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Restablecimiento de Contraseña en <span style="color: #007bff;">Build Mart</span> 🔑</h2>
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
};

export const enviarCorreoRecuperacion = async (emailDestino) => {
  if (!emailDestino) {
    throw new Error("El email del destinatario es obligatorio");
  }

  try {
    const { userGmail } = process.env;
    const htmlCorreo = generarHtmlRecuperacion();

    const mailOptions = {
      from: `"Build Mart" <${userGmail}>`,
      to: emailDestino,
      subject: `🔐 Build Mart - Contraseña Restablecida`,
      html: htmlCorreo,
      text: `Su contraseña en Build Mart ha sido actualizada correctamente. Ahora puede iniciar sesión con su nueva contraseña.`,
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
