import express from "express";
import Materia from "../models/Materia.js";
import User from "../models/User.js";
import Grupo from "../models/Grupo.js"; // Importar modelo Grupo para actualizaciones en cascada
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
                "TECNOLOGIA", "EDUCACION FISICA I", "EDUCACION FISICA II", "EDUCACION FISICA III",
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

// PUT update materia (admin only) - CASCADING UPDATE
materiasRouter.put("/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body; // Nuevo nombre

        if (!nombre) return res.status(400).json({ error: "Nombre es requerido" });

        const materia = await Materia.findById(id);
        if (!materia) return res.status(404).json({ error: "Materia no encontrada" });

        const oldName = materia.nombre;

        // Actualizar el nombre en la colección de Materias
        materia.nombre = nombre;
        await materia.save();

        // Actualizar el nombre en todos los usuarios (profesores) que tengan esta materia asignada
        await User.updateMany(
            { asignaturas: oldName },
            { $set: { "asignaturas.$": nombre } }
        );

        // Actualizar el nombre en GRUPOS (profesoresAsignados)
        await Grupo.updateMany(
            { "profesoresAsignados.asignatura": oldName },
            { $set: { "profesoresAsignados.$.asignatura": nombre } }
        );
        // Actualizar el nombre en GRUPOS (ordenMaterias)
        await Grupo.updateMany(
            { ordenMaterias: oldName },
            { $set: { "ordenMaterias.$": nombre } }
        );

        res.json({ msg: "Materia actualizada correctamente y sincronizada con profesores", materia });
    } catch (error) {
        console.error("Error al actualizar materia:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Ya existe una materia con ese nombre" });
        }
        res.status(500).json({ error: "Error al actualizar materia" });
    }
});

// DELETE materia (admin only) - CASCADING DELETE
materiasRouter.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const materia = await Materia.findById(id);
        if (!materia) return res.status(404).json({ error: "Materia no encontrada" });

        const materiaName = materia.nombre;

        // Eliminamos la materia de la colección principal
        await Materia.findByIdAndDelete(id);

        // Eliminamos la materia de los arrays 'asignaturas' de todos los profesores
        await User.updateMany(
            { asignaturas: materiaName },
            { $pull: { asignaturas: materiaName } }
        );

        // Eliminamos la materia de las asignaciones de todos los GRUPOS y del ordenMaterias
        await Grupo.updateMany(
            { "profesoresAsignados.asignatura": materiaName },
            { $pull: { profesoresAsignados: { asignatura: materiaName } } }
        );
        // También quitamos del ordenMaterias si existe
        await Grupo.updateMany(
            { ordenMaterias: materiaName },
            { $pull: { ordenMaterias: materiaName } }
        );

        res.json({ msg: "Materia eliminada y desasignada de todos los profesores" });
    } catch (error) {
        console.error("Error al eliminar materia:", error);
        res.status(500).json({ error: "Error al eliminar materia" });
    }
});

export { materiasRouter };
