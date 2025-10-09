import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";

// Importaciones eliminadas: path y fs (ya no se usan con Cloudinary)
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
// 1. Importar Cloudinary
import cloudinary from '../config/cloudinary.js'; 

const router = express.Router();

// ----------------- MULTER CONFIG PARA CLOUDINARY -----------------
// Cambiamos a memoryStorage para no guardar archivos localmente
const storage = multer.memoryStorage();
const upload = multer({ storage });
const uploadFotos = upload; // Renombramos para compatibilidad con Register

// ----------------- JWT middleware (Se mantiene igual) -----------------
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No hay token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ msg: "Token inválido" });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "No tienes permisos" });
    next();
  });
};

// Reset tokens
const resetTokens = {};

// Helpers
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// ----------------- RUTAS ------------------

// Register (CON CLOUDINARY)
router.post("/register", verifyAdmin, uploadFotos.single("foto"), async (req, res) => {
  try {
    let { nombre, edad, sexo, email, celular, password, role } = req.body;
    email = email.toLowerCase();
    let fotoUrl = "/uploads/fotos/default.png"; // Valor por defecto

    const existingUser = await User.findOne({ $or: [{ email }, { celular }] });
    if (existingUser) return res.status(400).json({ msg: "Usuario ya existe" });

    // Lógica de subida a Cloudinary
    if (req.file) {
        const publicId = `perfiles/profesor-${Date.now()}`; // ID único para el registro
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "perfiles", 
            public_id: publicId, 
            overwrite: true 
        });

        fotoUrl = result.secure_url; // URL de Cloudinary
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ nombre, edad, sexo, email, celular, password: hashedPassword, role: role || "profesor", foto: fotoUrl });
    await newUser.save();

    res.status(201).json({ msg: "Usuario registrado correctamente", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier }, { celular: identifier }] });
    if (!user) return res.status(400).json({ msg: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.json({
      token,
      user: { id: user._id, nombre: user.nombre, edad: user.edad, sexo: user.sexo, email: user.email, celular: user.celular, role: user.role, foto: user.foto, asignaturas: user.asignaturas || [], fechaRegistro: formatDate(user.createdAt) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Debe proporcionar un correo" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const token = crypto.randomBytes(4).toString("hex");
    resetTokens[email] = { token, expires: Date.now() + 15 * 60 * 1000 };

    await sendEmail(email, "Recuperación de contraseña", `<p>Tu código es: <b>${token}</b></p>`);
    res.json({ msg: "Código enviado a tu correo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error enviando el correo", error: err.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const savedToken = resetTokens[email];
    if (!savedToken || savedToken.token !== token || Date.now() > savedToken.expires)
      return res.status(400).json({ msg: "Token inválido o expirado" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    delete resetTokens[email];
    res.json({ msg: "Contraseña restablecida exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al restablecer la contraseña", error: err.message });
  }
});

// ---------------- RUTAS ADMIN / PROFESORES -----------------

// GET: Todos los profesores
router.get("/profesores", verifyAdmin, async (req, res) => {
  try {
    const profesores = await User.find({ role: "profesor" }).select(
      "nombre email celular edad sexo foto asignaturas createdAt"
    );

    // CORRECCIÓN: Se añade el campo 'correo' para que coincida con el frontend.
    const formatted = profesores.map((prof) => {
        const profObject = prof.toObject();
        return {
            ...profObject,
            correo: profObject.email, // Aquí se añade el campo 'correo'
            fechaRegistro: formatDate(prof.createdAt),
        }
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener profesores", error: err.message });
  }
});

// PUT: Actualizar asignaturas de un profesor
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

// DELETE: Eliminar profesor (LÓGICA ACTUALIZADA SIN FS)
router.delete("/profesores/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const profesor = await User.findById(id);
    if (!profesor) return res.status(404).json({ msg: "Profesor no encontrado" });

    // Ya no necesitamos eliminar la foto localmente (fs.unlinkSync)
    // Cloudinary permite eliminar recursos, pero eso requiere más lógica que es opcional aquí.

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

export { router as authRouter, verifyToken, verifyAdmin };
