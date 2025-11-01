import mongoose from 'mongoose';

const CalificacionSchema = new mongoose.Schema({
    // Vínculo con el grupo
    grupo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grupo',
        required: true,
    },
    // La materia
    asignatura: {
        type: String,
        required: true,
        trim: true,
    },
    // ⚠️ CORRECCIÓN CLAVE: Cambiar a Mixed para aceptar { 1: [{}], 2: [{}], 3: [{}] }
    criterios: {
        type: mongoose.Schema.Types.Mixed, 
        default: { 1: [], 2: [], 3: [] } // Inicializa con la estructura que espera el frontend
    },
    // Objeto con las calificaciones
    calificaciones: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// El índice compuesto sigue siendo válido para la unicidad.
CalificacionSchema.index({ grupo: 1, asignatura: 1 }, { unique: true });

const Calificacion = mongoose.model("Calificacion", CalificacionSchema);

export default Calificacion;