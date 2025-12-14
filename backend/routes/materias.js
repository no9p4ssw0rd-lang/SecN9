import express from "express";
import Materia from "../models/Materia.js";
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const materiasRouter = express.Router();

// GET all materias
materiasRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const materias = await Materia.find().sort({ nombre: 1 });
        res.json(materias);
    } catch (error) {
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
