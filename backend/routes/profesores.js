import express from "express";
import User from "../models/User.js";
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";
import multer from "multer";
// NOTA: 'path' y 'fs' ya no son necesarios para la subida con Cloudinary,
// pero se mantienen para la lógica de eliminación de profesores.
import path from "path";
import fs from "fs"; 

// Importamos la configuración de Cloudinary
import cloudinary from '../config/cloudinary.js'; // Asegúrate de crear este archivo

const profesoresRouter = express.Router();

// ---------------- INICIO: Configuración Multer para Cloudinary ----------------
// Configuración para que Multer almacene el archivo temporalmente en memoria (Buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });
// ---------------- FIN: Configuración Multer ----------------

// ---------------- Obtener todos los profesores (solo admin) ----------------
profesoresRouter.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const profesores = await User.find({ role: "profesor" });
    res.json(profesores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener profesores" });
  }
});

// ---------------- Actualizar asignaturas de un profesor (solo admin) ----------------
profesoresRouter.put("/:id/asignaturas", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { asignaturas } = req.body;
    const profesor = await User.findById(req.params.id);
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    profesor.asignaturas = asignaturas || [];
    await profesor.save();

    res.json({ msg: "Asignaturas actualizadas correctamente", asignaturas: profesor.asignaturas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar asignaturas" });
  }
});

// ---------------- Eliminar profesor (solo admin) ----------------
profesoresRouter.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const profesor = await User.findById(req.params.id);
        if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

        // Lógica de eliminación de imagen en Cloudinary
        const defaultPath = "/uploads/fotos/default.png";
        if (profesor.foto && profesor.foto !== defaultPath) {
            // Asume que la URL de Cloudinary contiene el public_id o puedes extraerlo
            // Si usaste el ID del usuario como public_id (ej: 'user-id-profile'), lo eliminas así:
            try {
                // await cloudinary.uploader.destroy(`user-${profesor._id}-profile`);
                // NOTA: Para este ejemplo, solo eliminaremos el registro, la eliminación real de Cloudinary
                // dependería de cómo manejaste el public_id al subir.
            } catch (error) {
                console.warn('Advertencia: No se pudo eliminar la imagen antigua de Cloudinary.', error);
            }
        }

        await profesor.deleteOne();
        res.json({ msg: "Profesor eliminado correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al eliminar profesor" });
    }
});


// ---------------- Editar perfil propio (CON CLOUDINARY) ----------------
profesoresRouter.put("/editar-perfil", authMiddleware, upload.single("foto"), async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, email, celular, edad, sexo } = req.body;
        let fotoUrl = null;

        // Validación simplificada (ajusta según necesites)
        if (!nombre || !email || !celular || !edad || !sexo)
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        // Verificaciones de email y celular (se mantienen igual)
        if (email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ msg: "El correo ya está en uso" });
        }

        if (celular !== user.celular) {
            const celularExists = await User.findOne({ celular });
            if (celularExists) return res.status(400).json({ msg: "El celular ya está en uso" });
        }

        // ------------------ Lógica de Subida a Cloudinary ------------------
        if (req.file) {
            // El public_id ayuda a que Cloudinary reemplace la foto antigua del usuario
            const publicId = `perfiles/user-${userId}`; 

            // 1. Convertir el Buffer del archivo a Data URI
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            
            // 2. Subir a Cloudinary
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: "perfiles", 
                public_id: publicId, 
                overwrite: true // Permite reemplazar el archivo si ya existe
            });

            fotoUrl = result.secure_url; // Esta es la URL completa que guardaremos
        }
        // ------------------ FIN Lógica de Subida a Cloudinary ------------------

        // 3. Actualizar campos
        user.nombre = nombre;
        user.email = email;
        user.celular = celular;
        user.edad = edad;
        user.sexo = sexo;

        if (fotoUrl) {
             // Guardamos la URL de Cloudinary
            user.foto = fotoUrl; 
        }

        await user.save();
        res.json({ msg: "Perfil actualizado correctamente", user });
    } catch (err) {
        console.error(err);
        // Si falla Cloudinary (ej: credenciales malas), el error también llega aquí.
        res.status(500).json({ msg: "Error al actualizar perfil o subir foto", error: err.message });
    }
});

// ---------------- Obtener perfil propio ----------------
profesoresRouter.get("/mi-perfil", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener perfil", error: err.message });
  }
});

export { profesoresRouter };
