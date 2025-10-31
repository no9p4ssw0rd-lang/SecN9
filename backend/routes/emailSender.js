import express from 'express';

// Se importa la nueva función para enviar correos con SendGrid
import { sendEmail } from '../utils/sendEmail.js'; 
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware para verificar si el usuario es administrador
const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ msg: "Acceso denegado. Se requiere rol de administrador." });
    }
};

// --- RUTA PARA ENVIAR BOLETAS DE CALIFICACIONES INDIVIDUALES ---
// Endpoint: POST /api/enviar-boleta
router.post('/enviar-boleta', authMiddleware, verifyAdmin, async (req, res) => {
    const { to, subject, body, pdfData } = req.body;

    if (!to || !subject || !body || !pdfData) {
        return res.status(400).json({ error: 'Faltan datos para enviar el correo.' });
    }

    try {
        // Prepara el adjunto para SendGrid
        const attachment = {
            content: pdfData,
            filename: 'Boleta_de_Calificaciones.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
        };

        // Usa la función de sendEmail con SendGrid
        await sendEmail(to, subject, body, [attachment]);
        
        res.status(200).json({ message: 'Boleta enviada exitosamente por correo.' });

    } catch (error) {
        console.error('Error al enviar boleta por correo:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al intentar enviar el correo.' });
    }
});


// --- RUTA PARA ENVIAR EL HORARIO GENERAL A MÚLTIPLES PROFESORES ---
// Endpoint: POST /api/enviar-horario
router.post('/enviar-horario', authMiddleware, verifyAdmin, async (req, res) => {
    const { to, subject, body, pdfData, fileName } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0 || !pdfData) {
        return res.status(400).json({ error: 'Faltan destinatarios o datos del PDF.' });
    }

    try {
        // Prepara el adjunto para SendGrid
        const attachment = {
            content: pdfData,
            filename: fileName || 'Horario.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
        };

        // Usa la función de sendEmail con SendGrid
        await sendEmail(to, subject, body, [attachment]);

        res.status(200).json({ message: 'Horario enviado a los profesores exitosamente.' });

    } catch (error) {
        console.error('Error al enviar el horario por correo:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al intentar enviar el correo.' });
    }
});

// Exporta el router para usarlo en server.js
export { router as emailRouter };

