import express from 'express';
import nodemailer from 'nodemailer';
// Asegúrate de que la ruta a tu middleware de autenticación sea la correcta.
// Basado en tu estructura de archivos, debería ser algo así:
import { authMiddleware } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// --- RUTA PARA ENVIAR BOLETAS DE CALIFICACIONES INDIVIDUALES ---
// Endpoint: POST /api/enviar-boleta
router.post('/enviar-boleta', authMiddleware, async (req, res) => {
    // Extrae los datos del cuerpo de la solicitud
    const { to, subject, body, pdfData } = req.body;

    // Valida que todos los campos necesarios estén presentes
    if (!to || !subject || !body || !pdfData) {
        return res.status(400).json({ error: 'Faltan datos para enviar el correo.' });
    }

    try {
        // Configura el "transportador" de correo usando las credenciales de tu archivo .env
        const transporter = nodemailer.createTransport({
            service: 'gmail', // o el servicio que estés utilizando
            auth: {
                user: process.env.EMAIL_USER, // Tu correo electrónico
                pass: process.env.EMAIL_PASS,  // Tu contraseña de aplicación de Google
            },
        });

        // Define las opciones del correo electrónico
        const mailOptions = {
            from: `"Escuela Secundaria N.9" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: body,
            // Adjunta el archivo PDF que viene en formato base64 desde el frontend
            attachments: [
                {
                    filename: 'Boleta_de_Calificaciones.pdf',
                    content: pdfData,   
                    encoding: 'base64',  
                    contentType: 'application/pdf'
                },
            ],
        };

        // Envía el correo
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Boleta enviada exitosamente por correo.' });

    } catch (error) {
        console.error('Error al enviar boleta por correo:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al intentar enviar el correo.' });
    }
});


// --- RUTA PARA ENVIAR EL HORARIO GENERAL A MÚLTIPLES PROFESORES ---
// Endpoint: POST /api/enviar-horario
router.post('/enviar-horario', authMiddleware, async (req, res) => {
    // 'to' ahora es un array de correos, 'fileName' es el nombre del archivo
    const { to, subject, body, pdfData, fileName } = req.body;

    // Valida que los datos necesarios existan
    if (!to || !Array.isArray(to) || to.length === 0 || !pdfData) {
        return res.status(400).json({ error: 'Faltan destinatarios o datos del PDF.' });
    }

    try {
        // Reutiliza la misma configuración del transportador
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Prepara las opciones del correo
        const mailOptions = {
            from: `"Administración Escolar" <${process.env.EMAIL_USER}>`,
            to: to.join(', '), // Une el array de correos en un string separado por comas
            subject: subject || 'Horario Escolar',
            html: body || 'Se adjunta el horario escolar.',
            attachments: [
                {
                    filename: fileName || 'Horario.pdf', // Usa el nombre de archivo del frontend
                    content: pdfData,
                    encoding: 'base64',
                    contentType: 'application/pdf'
                },
            ],
        };

        // Envía el correo
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Horario enviado a los profesores exitosamente.' });

    } catch (error) {
        console.error('Error al enviar el horario por correo:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al intentar enviar el correo.' });
    }
});

// Exporta el router para que puedas usarlo en tu archivo principal (server.js)
export { router as emailRouter };

