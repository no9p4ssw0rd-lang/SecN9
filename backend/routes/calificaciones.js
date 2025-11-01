import express from 'express';
import Calificacion from '../models/Calificacion.js'; 
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- RUTAS DE PROFESOR ---

/**
 * @route   GET /calificaciones?grupoId=...&asignatura=...
 * @desc    Obtiene los criterios y calificaciones para una materia específica de un grupo.
 * @access  Private (Profesores)
 */
router.get('/', authMiddleware, async (req, res) => {
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
      // ✅ CORRECCIÓN 1: Devolver la estructura correcta del esquema de Mongoose para 'criterios'
      // El esquema define criterios como: { 1: [], 2: [], 3: [] }, no como []
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
 * @desc    Guarda o actualiza los criterios y calificaciones para una materia de un grupo.
 * @access  Private (Profesores)
 */
router.post('/', authMiddleware, async (req, res) => {
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

// --- RUTA CLAVE CORREGIDA PARA EL ADMINISTRADOR ---

/**
 * @route   GET /calificaciones/:grupoId/calificaciones-admin
 * @desc    Obtiene el consolidado de calificaciones por alumno para el dashboard Admin.
 * Esta ruta es la que fallaba con 'criterios.forEach is not a function'.
 * @access  Private (Admin)
 */
// NOTA: Si este archivo de router está montado en /calificaciones, la ruta real sería /calificaciones/:grupoId/calificaciones-admin
// Si está montado en /grupos, la ruta real sería /grupos/:grupoId/calificaciones-admin
router.get('/:grupoId/calificaciones-admin', authMiddleware, async (req, res) => {
    try {
        const { grupoId } = req.params;

        // Obtener todos los documentos de calificaciones para el grupo
        const calificacionesDelGrupo = await Calificacion.find({ grupo: grupoId }).lean();
        
        const consolidadoPorAlumno = {};

        // 2. Iterar sobre cada documento de Calificación (1 documento = 1 materia)
        calificacionesDelGrupo.forEach(registroMateria => {
            const nombreMateria = registroMateria.asignatura;
            // Usamos un objeto vacío por defecto en caso de que no haya calificaciones.
            const calificacionesMateria = registroMateria.calificaciones || {}; 
            
            // ✅ CORRECCIÓN 2: Evitar usar .forEach() en el objeto criterios, que era el problema.

            // Iteramos sobre el objeto de calificaciones por alumno
            Object.entries(calificacionesMateria).forEach(([alumnoId, calsArray]) => {
                // calsArray es [T1, T2, T3]
                if (!consolidadoPorAlumno[alumnoId]) {
                    consolidadoPorAlumno[alumnoId] = {};
                }
                consolidadoPorAlumno[alumnoId][nombreMateria] = calsArray;
            });

        });

        // El frontend recibe { "alumnoId": { "MateriaA": [c1, c2, c3], "MateriaB": [c1, c2, c3] }, ... }
        res.json(consolidadoPorAlumno); 

    } catch (error) {
        console.error("Error procesando calificaciones para admin (SOLUCIÓN IMPLEMENTADA):", error);
        res.status(500).json({ msg: 'Error interno del servidor al consolidar calificaciones' });
    }
});


export { router as calificacionesRouter };