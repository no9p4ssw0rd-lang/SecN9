import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Configura la API Key de SendGrid que pusiste en las variables de entorno
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Envía un correo electrónico usando SendGrid.
 * @param {string|Array<string>} to - El destinatario o un array de destinatarios.
 * @param {string} subject - El asunto del correo.
 * @param {string} html - El cuerpo del correo en formato HTML.
 * @param {Array} attachments - Opcional: un array de archivos adjuntos en formato SendGrid.
 */
export const sendEmail = async (to, subject, html, attachments = []) => {
  // Prepara el mensaje para la API de SendGrid
  const msg = {
    to: to, // Puede ser un string o un array de strings
    from: process.env.SENDGRID_FROM_EMAIL, // El correo que verificaste en SendGrid
    subject: subject,
    html: html,
    attachments: attachments,
  };

  try {
    // Envía el correo
    await sgMail.send(msg);
    console.log(`Correo enviado exitosamente a ${Array.isArray(to) ? to.join(', ') : to}`);
  } catch (error) {
    console.error('Error al enviar el correo con SendGrid:', error);
    // Si hay un error, lo muestra en los logs de Render para facilitar la depuración
    if (error.response) {
      console.error(error.response.body);
    }
    // Lanza el error para que la ruta que lo llamó sepa que algo salió mal
    throw new Error('No se pudo enviar el correo a través de SendGrid.');
  }
};