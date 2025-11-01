import express from 'express';
import Calificacion from '../models/Calificacion.js'; // Usando exportación por defecto
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- RUTAS DE PROFESOR (Ya existentes) ---

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

    // Busca el documento de calificación que coincida con el grupo Y la asignatura
    const registroDeCalificaciones = await Calificacion.findOne({ 
      grupo: grupoId, 
      asignatura: asignatura 
    });

    if (!registroDeCalificaciones) {
      // Si no existe, es la primera vez que el profesor abre esta materia.
      // Se devuelve una estructura vacía para que el frontend no falle.
      return res.json({ criterios: { 1: [], 2: [], 3: [] }, calificaciones: {} }); 
      // NOTA: Se devuelve criterios como objeto vacío { 1:[],...} según tu Schema.
    }

    res.json(registroDeCalificaciones);

  } catch (error) {
    console.error("Error al obtener calificaciones:", error.message);
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
        // Busca un documento por grupo y asignatura, y lo actualiza.
        // Si no lo encuentra, 'upsert: true' crea uno nuevo.
        const registroActualizado = await Calificacion.findOneAndUpdate(
            { grupo: grupoId, asignatura: asignatura }, // El filtro para encontrar el documento correcto
            { criterios, calificaciones, grupo: grupoId, asignatura: asignatura }, // Los datos a guardar/actualizar
            { upsert: true, new: true, setDefaultsOnInsert: true } // Opciones: upsert crea si no existe, new devuelve el doc actualizado
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

// ----------------------------------------------------------------------
// --- RUTA AGREGADA Y CORREGIDA PARA EL ADMINISTRADOR ---
// ----------------------------------------------------------------------

/**
 * @route   GET /calificaciones/:grupoId/calificaciones-admin
 * @desc    Obtiene el consolidado de calificaciones por alumno para el dashboard Admin.
 * Esta ruta es la que el frontend llama en el componente Calificaciones.
 * @access  Private (Admin)
 */
// NOTA: Esta ruta asume que tu archivo principal de rutas lo monta como app.use('/grupos', grupoRoutes)
// y esta función está dentro de ese router. 
router.get('/:grupoId/calificaciones-admin', authMiddleware, async (req, res) => {
    try {
        const { grupoId } = req.params;

        // 1. Obtener todos los documentos de calificaciones para el grupo
        const calificacionesDelGrupo = await Calificacion.find({ grupo: grupoId }).lean();
        
        // Objeto final de calificaciones consolidado: 
        // { alumnoId: { materia: [calT1, calT2, calT3], ... }, ... }
        const consolidadoPorAlumno = {};

        // 2. Iterar sobre cada documento de Calificación (que representa 1 materia)
        calificacionesDelGrupo.forEach(registroMateria => {
            const nombreMateria = registroMateria.asignatura;
            const calificacionesMateria = registroMateria.calificaciones || {}; 
            
            // 🚨 SOLUCIÓN AL ERROR: El campo 'registroMateria.criterios' NO se toca aquí.
            // Si el código anterior intentaba: registroMateria.criterios.forEach(), 
            // causaba el error ya que 'criterios' es un objeto, no un array.

            // 3. Iterar sobre cada alumno que tiene calificaciones en esta materia
            Object.entries(calificacionesMateria).forEach(([alumnoId, calsArray]) => {
                // Inicializar el alumno si es la primera vez que aparece
                if (!consolidadoPorAlumno[alumnoId]) {
                    consolidadoPorAlumno[alumnoId] = {};
                }
                // Asignar las calificaciones de esta materia al alumno
                consolidadoPorAlumno[alumnoId][nombreMateria] = calsArray;
            });

        });

        // El frontend espera este objeto consolidado
        res.json(consolidadoPorAlumno); 

    } catch (error) {
        console.error("Error procesando calificaciones para admin:", error);
        // El error en el log de Render provenía de un fallo aquí, ¡ahora está corregido!
        res.status(500).json({ msg: 'Error interno del servidor al consolidar calificaciones' });
    }
});


export { router as calificacionesRouter };