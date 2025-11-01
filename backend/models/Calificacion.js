import express from 'express';
// 🛑 CORRECCIÓN: Si el modelo Calificacion.js NO usa 'export default Calificacion',
// debes usar una importación con nombre, por ejemplo, import { Calificacion } from '...';
// Basado en el error de Render, cambiamos a importación con nombre (desestructurando).
import { Calificacion } from '../models/Calificacion.js'; 
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /calificaciones?grupoId=...&asignatura=...
 * @desc    Obtiene los criterios y calificaciones para una materia específica de un grupo (Vista Profesor).
 * @access  Private (Profesores)
 */
router.get('/', authMiddleware, async (req, res) => {
// ... El resto de la lógica de la ruta GET (sin cambios) ...
  try {
    const { grupoId, asignatura } = req.query;
    if (!grupoId || !asignatura) {
      return res.status(400).json({ msg: 'Se requieren los parámetros grupoId y asignatura' });
    }

    const registroDeCalificaciones = await Calificacion.findOne({ 
      grupo: grupoId, 
      asignatura: asignatura 
    });

    if (!registroDeCalificaciones) {
      return res.json({ 
        criterios: { 1: [], 2: [], 3: [] }, 
        calificaciones: {} 
      });
    }

    res.json(registroDeCalificaciones);

  } catch (error) {
    console.error("Error al obtener calificaciones (Profesor):", error.message);
    res.status(500).send('Error del Servidor');
  }
});

/**
 * @route   POST /calificaciones
 * @desc    Guarda o actualiza los criterios y calificaciones para una materia de un grupo (Vista Profesor).
 * @access  Private (Profesores)
 */
router.post('/', authMiddleware, async (req, res) => {
// ... El resto de la lógica de la ruta POST (sin cambios) ...
    const { grupoId, asignatura, criterios, calificaciones } = req.body;
    
    if (!grupoId || !asignatura || !criterios || calificaciones === undefined) {
        return res.status(400).json({ msg: 'Faltan datos requeridos (grupoId, asignatura, criterios, calificaciones)' });
    }

    try {
        const registroActualizado = await Calificacion.findOneAndUpdate(
            { grupo: grupoId, asignatura: asignatura }, 
            { criterios, calificaciones, grupo: grupoId, asignatura: asignatura },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        res.status(200).json({ 
            msg: 'Calificaciones guardadas exitosamente',
            data: registroActualizado 
        });

    } catch (error) {
        console.error("Error al guardar calificaciones:", error.message);
        res.status(500).send('Error del Servidor');
    }
});

export { router as calificacionesRouter };
