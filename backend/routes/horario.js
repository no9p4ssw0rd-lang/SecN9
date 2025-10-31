import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Se importa la función para enviar correos con SendGrid
import { sendEmail } from "../utils/sendEmail.js";

import Horario from "../models/Horario.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware para verificar si el usuario es administrador
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Si es admin, continúa
  } else {
    // Si no, devuelve un error de acceso prohibido
    return res.status(403).json({ msg: "Acceso denegado. Se requiere rol de administrador." });
  }
};

// Se inicializa Multer para procesar datos de formulario, pero sin guardar archivos localmente
const upload = multer();

// Función de ayuda para parsear JSON de forma segura
const parseJSON = (input) => {
    if (!input) return {};
    if (typeof input === "object") return input;
    try { return JSON.parse(input); } catch { return {}; }
};

// --- RUTAS CRUD PARA HORARIOS ---

// POST /horario - Crear o actualizar los datos de un horario
router.post("/", authMiddleware, verifyAdmin, async (req, res) => {
    try {
        const { anio, datos, leyenda } = req.body;
        if (!anio) return res.status(400).json({ msg: "Debe especificar el año" });

        // Busca el horario por año o crea uno nuevo
        let horario = await Horario.findOne({ anio }) || new Horario({ anio });
        
        // Actualiza los datos y la leyenda
        horario.datos = parseJSON(datos);
        horario.leyenda = parseJSON(leyenda);
        
        await horario.save();
        res.status(201).json({ success: true, horario });
    } catch (err) {
        console.error("Error al guardar el horario:", err);
        res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
});

// GET /horario/:anio - Obtener un horario específico
router.get("/:anio", authMiddleware, async (req, res) => {
    try {
        const horario = await Horario.findOne({ anio: req.params.anio });
        if (!horario) return res.status(404).json({ datos: {}, leyenda: {}, pdfUrl: null });
        res.json({ datos: horario.datos, leyenda: horario.leyenda, pdfUrl: horario.pdfUrl || null });
    } catch (err) {
        console.error("Error al obtener horario por año:", err);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

// GET /horario - Obtener la lista de todos los horarios
router.get("/", authMiddleware, async (req, res) => {
  try {
    const horarios = await Horario.find().select("anio pdfUrl").sort({ anio: -1 });
    res.json(horarios);
  } catch (err) {
    console.error("Error obteniendo lista de horarios:", err);
    res.status(500).json({ msg: "Error interno del servidor." });
  }
});

// DELETE /horario/:anio - Eliminar un horario
router.delete("/:anio", authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const horario = await Horario.findOneAndDelete({ anio: req.params.anio });
    if (!horario) return res.status(404).json({ msg: "Horario no encontrado" });

    // Nota: La lógica para borrar archivos de Cloudinary iría aquí si fuera necesario.
    
    res.json({ msg: `Horario del año ${req.params.anio} eliminado correctamente` });
  } catch (err) {
    console.error("Error eliminando horario:", err);
    res.status(500).json({ msg: "Error interno del servidor." });
  }
});


// --- RUTA PARA ENVIAR HORARIO POR CORREO ---
router.post("/enviar", authMiddleware, verifyAdmin, async (req, res) => {
    const { to, subject, body, pdfData, fileName } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0 || !pdfData) {
        return res.status(400).json({ error: 'Faltan destinatarios o los datos del PDF.' });
    }

    try {
        // Prepara el archivo adjunto para SendGrid
        const attachment = {
            content: pdfData,
            filename: fileName || 'Horario.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
        };

        // Usa la función de sendEmail para enviar el correo
        await sendEmail(to, subject, body, [attachment]);

        res.status(200).json({ message: 'Horario enviado a los profesores exitosamente.' });

    } catch (error) {
        console.error('Error al enviar el horario por correo:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al intentar enviar el correo.' });
    }
});

export { router as horarioRouter };

