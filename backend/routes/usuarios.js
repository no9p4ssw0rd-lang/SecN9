import express from "express";
import multer from "multer";
import path from "path";
import User from "../models/User.js";
import { verifyToken, verifyAdmin } from "./auth.js"; // Asumiendo que './auth.js' exporta verifyToken y verifyAdmin
// 1. Importar Cloudinary (Asegúrate de que este archivo exista en tu estructura)
import cloudinary from '../config/cloudinary.js'; 

const router = express.Router();

// ----------------- HELPERS -----------------
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// ----------------- MULTER CONFIG PARA CLOUDINARY -----------------
// Cambiamos a memoryStorage para no guardar archivos localmente
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----------------- RUTAS -----------------

// GET: Todos los profesores (admin)
router.get("/profesores", verifyAdmin, async (req, res) => {
  try {
    const profesores = await User.find({ role: "profesor" }).select(
      "nombre email celular edad sexo foto asignaturas createdAt"
    );

    const formatted = profesores.map((prof) => ({
      ...prof.toObject(),
      fechaRegistro: formatDate(prof.createdAt),
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener profesores", error: err.message });
  }
});

// PUT: Actualizar asignaturas de un profesor (admin)
router.put("/profesores/:id/asignaturas", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { asignaturas } = req.body;

    const profesor = await User.findById(id);
    if (!profesor) return res.status(404).json({ msg: "Profesor no encontrado" });

    profesor.asignaturas = asignaturas || [];
    await profesor.save();

    res.json({ msg: "Asignaturas actualizadas correctamente", asignaturas: profesor.asignaturas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al actualizar asignaturas", error: err.message });
  }
});

// DELETE: Eliminar profesor (admin)
router.delete("/profesores/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const profesor = await User.findById(id);
    if (!profesor) return res.status(404).json({ msg: "Profesor no encontrado" });
    
    // NOTA: Se recomienda añadir aquí la lógica de eliminación de Cloudinary,
    // pero para mantener el código simple por ahora, solo borramos el registro.

    await profesor.deleteOne();
    res.json({ msg: "Profesor eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al eliminar profesor", error: err.message });
  }
});

// ----------------- EDITAR PERFIL (usuarios logueados) CON CLOUDINARY -----------------
router.put("/editar-perfil", verifyToken, upload.single("foto"), async (req, res) => {
  try {
    const userId = req.user.id; // viene de verifyToken
    const { nombre, edad, email, sexo, celular } = req.body;
    let fotoUrl = null;

    // 1. Obtener usuario para validaciones
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    // 2. Lógica de Subida a Cloudinary
    if (req.file) {
        // Usa el ID del usuario como public_id para que Cloudinary reemplace el archivo anterior
        const publicId = `perfiles/user-${userId}`; 

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "perfiles", 
            public_id: publicId, 
            overwrite: true 
        });

        fotoUrl = result.secure_url; // URL de Cloudinary
    }

    // 3. Preparar datos de actualización
    const updateData = { 
        nombre, 
        edad, 
        email, 
        sexo, 
        celular,
        ...(fotoUrl && { foto: fotoUrl }) // Añadir la URL de la foto solo si se subió
    };

    // NOTA: Si necesitas validación de unicidad de email/celular, hazla aquí, 
    // pero recuerda que estás usando findByIdAndUpdate que no dispara pre-save hooks.
    // Es mejor validar antes de la llamada:
    
    // 4. Actualizar en la base de datos
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json({ msg: "Perfil actualizado correctamente", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al editar perfil o subir foto", error: err.message });
  }
});

export default router;
