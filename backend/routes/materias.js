import express from "express";
import Materia from "../models/Materia.js";
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const materiasRouter = express.Router();

// GET all materias
materiasRouter.get("/", authMiddleware, async (req, res) => {
    try {
        // Si no hay materias, poblamos con las de por defecto
        const count = await Materia.countDocuments();
        if (count === 0) {
            const defaultMaterias = [
                "ESPAÑOL I", "ESPAÑOL II", "ESPAÑOL III", "INGLES I", "INGLES II", "INGLES III", "ARTES I", "ARTES II", "ARTES III",
                "MATEMATICAS I", "MATEMATICAS II", "MATEMATICAS III", "BIOLOGIA I", "FISICA II", "QUIMICA III", "GEOGRAFIA I",
                "HISTORIA I", "HISTORIA II", "HISTORIA III", "FORMACION CIVICA Y ETICA I", "FORMACION CIVICA Y ETICA II", "FORMACION CIVICA Y ETICA III",
                "TECNOLOGIA I", "TECNOLOGIA II", "TECNOLOGIA III", "EDUCACION FISICA I", "EDUCACION FISICA II", "EDUCACION FISICA III",
                "INTEGRACION CURRICULAR I", "INTEGRACION CURRICULAR II", "INTEGRACION CURRICULAR III",
                "TUTORIA I", "TUTORIA II", "TUTORIA III"
            ];
            // Insertamos ignorando duplicados (aunque está vacío)
            await Materia.insertMany(defaultMaterias.map(nombre => ({ nombre })));
        }

        const materias = await Materia.find().sort({ nombre: 1 });
        res.json(materias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener materias" });
    }
});

// POST new materia (admin only)
materiasRouter.post("/", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ error: "Nombre es requerido" });

        const nuevaMateria = new Materia({ nombre });
        await nuevaMateria.save();
        res.status(201).json(nuevaMateria);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "La materia ya existe" });
        }
        res.status(500).json({ error: "Error al crear materia" });
    }
});

// DELETE materia (admin only)
materiasRouter.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Materia.findByIdAndDelete(id);
        res.json({ msg: "Materia eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar materia" });
    }
});

export { materiasRouter };
