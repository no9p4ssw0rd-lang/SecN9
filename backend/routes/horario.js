import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";

import Horario from "../models/Horario.js";
// Corregido: Se importa el middleware de autenticación principal.
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware para verificar el rol de administrador
// Este se debe usar DESPUÉS de authMiddleware, ya que necesita req.user.
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Si es admin, permite continuar
  } else {
    // Si no es admin, envía un error de "Prohibido"
    return res.status(403).json({ msg: "Acceso denegado. Se requiere rol de administrador." });
  }
};


// Configuración de Multer para almacenar los PDFs de horarios subidos
const storagePdf = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads/pdfHorarios");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const anio = req.body.anio || "unknown";
    cb(null, `horario_${anio}_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const uploadPdf = multer({ storage: storagePdf });

// Función de ayuda para parsear JSON de forma segura
const parseJSON = (input) => {
  if (!input) return {};
  if (typeof input === "object") return input;
  try { return JSON.parse(input); } catch { return {}; }
};

// --- RUTAS CRUD PARA HORARIOS ---

// POST /horario - Crear o actualizar un horario
// Corregido: Se aplica primero la autenticación y luego la verificación de admin.
router.post("/", authMiddleware, verifyAdmin, uploadPdf.single("pdf"), async (req, res) => {
  try {
    const { anio, datos, leyenda } = req.body;
    if (!anio) return res.status(400).json({ msg: "Debe especificar el año" });

    let horario = await Horario.findOne({ anio }) || new Horario({ anio });
    
    horario.datos = parseJSON(datos);
    horario.leyenda = parseJSON(leyenda);

    if (req.file) {
      if (horario.pdfUrl) {
          const oldPath = path.join(process.cwd(), horario.pdfUrl);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      horario.pdfUrl = `/uploads/pdfHorarios/${req.file.filename}`;
    }

    await horario.save();
    res.status(201).json({ success: true, horario });
  } catch (err) {
    console.error("Error al guardar el horario:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});

// GET /horario/:anio - Obtener un horario específico por año
// Corregido: Se usa authMiddleware para verificar el token.
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

// GET /horario - Obtener una lista de todos los horarios disponibles
// Corregido: Se usa authMiddleware para verificar el token.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const horarios = await Horario.find().select("anio pdfUrl").sort({ anio: -1 });
    res.json(horarios);
  } catch (err) {
    console.error("Error obteniendo lista de horarios:", err);
    res.status(500).json({ msg: "Error interno del servidor." });
  }
});

// DELETE /horario/:anio - Eliminar un horario por año
// Corregido: Se aplica primero la autenticación y luego la verificación de admin.
router.delete("/:anio", authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const horario = await Horario.findOne({ anio: req.params.anio });
    if (!horario) return res.status(404).json({ msg: "Horario no encontrado" });

    if (horario.pdfUrl) {
      const pdfPath = path.join(process.cwd(), horario.pdfUrl);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }

    await Horario.deleteOne({ anio: req.params.anio });
    res.json({ msg: `Horario del año ${req.params.anio} eliminado correctamente` });
  } catch (err) {
    console.error("Error eliminando horario:", err);
    res.status(500).json({ msg: "Error interno del servidor." });
  }
});


// --- RUTA PARA ENVIAR HORARIO POR CORREO ---
// POST /horario/enviar
// Corregido: Se aplica primero la autenticación y luego la verificación de admin.
router.post("/enviar", authMiddleware, verifyAdmin, async (req, res) => {
    const { to, subject, body, pdfData, fileName } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0 || !pdfData) {
        return res.status(400).json({ error: 'Faltan destinatarios o los datos del PDF.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Administración Escolar" <${process.env.EMAIL_USER}>`,
            to: to.join(', '),
            subject: subject || 'Horario Escolar',
            html: body || 'Se adjunta el horario escolar para su consulta.',
            attachments: [
                {
                    filename: fileName || 'Horario.pdf',
                    content: pdfData,
                    encoding: 'base64',
                    contentType: 'application/pdf'
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Horario enviado a los profesores exitosamente.' });

    } catch (error) {
        console.error('Error al enviar el horario por correo:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al intentar enviar el correo.' });
    }
});


export { router as horarioRouter };

