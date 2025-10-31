import express from "express";
import User from "../models/User.js";
// Los middlewares de autenticación deben adaptarse al nombre que uses:
// En el primer ejemplo se usan 'authMiddleware' e 'isAdmin'.
// En el segundo ejemplo se usan 'verifyToken' y 'verifyAdmin'.
// Asumiré que quieres usar 'authMiddleware' e 'isAdmin' del primer ejemplo
// ya que 'profesoresRouter' ya los importaba.
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js"; 
import multer from "multer";
import path from "path"; // Se mantiene por si se necesita lógica de ruta en otros lugares, aunque no para Cloudinary
import fs from "fs"; // Se mantiene por si se necesita lógica de archivos en otros lugares
import cloudinary from '../config/cloudinary.js'; // Importamos la configuración de Cloudinary

const router = express.Router(); // Cambié 'profesoresRouter' a 'router' para mayor generalidad

// ----------------- HELPERS -----------------
/**
 * Formatea una fecha a DD/MM/YYYY.
 * @param {Date | string} date - La fecha a formatear.
 * @returns {string} La fecha formateada o "N/A".
 */
const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    // Asegurarse de que el mes sea +1 ya que es base 0
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

// ---------------- INICIO: Configuración Multer para Cloudinary ----------------
// Configuración para que Multer almacene el archivo temporalmente en memoria (Buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });
// ---------------- FIN: Configuración Multer ----------------

// ---------------- Obtener todos los profesores (solo admin) ----------------
router.get("/profesores", authMiddleware, isAdmin, async (req, res) => {
    try {
        const profesores = await User.find({ role: "profesor" }).select(
            "nombre email celular edad sexo foto asignaturas createdAt"
        );
        
        // Aplicar formato de fecha
        const formatted = profesores.map((prof) => ({
            ...prof.toObject(),
            fechaRegistro: formatDate(prof.createdAt),
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener profesores", msg: err.message });
    }
});

// ---------------- Actualizar asignaturas de un profesor (solo admin) ----------------
router.put("/profesores/:id/asignaturas", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { asignaturas } = req.body;
        const profesor = await User.findById(req.params.id);
        if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

        profesor.asignaturas = asignaturas || [];
        await profesor.save();

        res.json({ msg: "Asignaturas actualizadas correctamente", asignaturas: profesor.asignaturas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar asignaturas", msg: err.message });
    }
});

// ---------------- Eliminar profesor (solo admin) ----------------
router.delete("/profesores/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const profesor = await User.findById(req.params.id);
        if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

        // Lógica de eliminación de imagen en Cloudinary (opcional, basado en tu implementación de public_id)
        // Si al subir usaste un public_id como `perfiles/user-${profesor._id}`, puedes intentar eliminarlo aquí.
        const defaultUrl = "/uploads/fotos/default.png"; // O la URL de tu imagen por defecto de Cloudinary
        if (profesor.foto && profesor.foto !== defaultUrl && profesor.foto.includes('cloudinary')) {
            try {
                // Si la URL es la de Cloudinary, asumimos que el public_id es 'perfiles/user-ID'
                const publicId = `perfiles/user-${profesor._id}`; 
                // Eliminación asíncrona (no bloquea el flujo si falla, solo advierte)
                await cloudinary.uploader.destroy(publicId); 
            } catch (error) {
                console.warn(`Advertencia: No se pudo eliminar la imagen antigua de Cloudinary (${profesor.foto}).`, error.message);
            }
        }

        await profesor.deleteOne();
        res.json({ msg: "Profesor eliminado correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al eliminar profesor", msg: err.message });
    }
});


// ---------------- Editar perfil propio (CON CLOUDINARY) ----------------
router.put("/editar-perfil", authMiddleware, upload.single("foto"), async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, email, celular, edad, sexo } = req.body;
        let fotoUrl = null;

        // Validación simplificada
        if (!nombre || !email || !celular || !edad || !sexo)
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        // Verificaciones de unicidad de email y celular
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
            const publicId = `perfiles/user-${userId}`; 

            // 1. Convertir el Buffer del archivo a Data URI
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            
            // 2. Subir a Cloudinary (la carpeta "perfiles" debe existir o Cloudinary la creará)
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: "perfiles", 
                public_id: publicId, 
                overwrite: true // Reemplaza la imagen si ya existe
            });

            fotoUrl = result.secure_url; // URL de Cloudinary
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
        // Excluimos la contraseña al devolver el usuario actualizado
        const userWithoutPassword = await User.findById(userId).select("-password"); 
        res.json({ msg: "Perfil actualizado correctamente", user: userWithoutPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Error al actualizar perfil o subir foto", error: err.message });
    }
});

// ---------------- Obtener perfil propio ----------------
router.get("/mi-perfil", authMiddleware, async (req, res) => {
    try {
        // req.user.id viene del middleware authMiddleware/verifyToken
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Error al obtener perfil", error: err.message });
    }
});

export default router;