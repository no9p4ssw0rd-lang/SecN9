import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from './Logoescuela.png';
import ConfirmacionModal from './ConfirmacionModal';

// La URL de la API se obtiene de las variables de entorno para Vercel/Render
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ======================================
// --- 1. Componente de Notificación (Integrado) ---
// ======================================
function Notificacion({ mensaje, tipo, onClose }) {
    useEffect(() => {
        if (mensaje) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje, onClose]);

    if (!mensaje) return null;

    const claseTipo = tipo === 'exito' ? 'exito' : 'error';

    // CLAVE: Usamos un z-index alto para la notificación
    return <div className={`notificacion-flotante ${claseTipo}`}>{mensaje}</div>;
}


// ======================================
// --- COMPONENTE NUEVO: Modal para Nombre de Tarea ---
// Se abre una vez por columna (tareaIndex) para asignar el nombre a todos.
// ======================================
const ModalNombreTarea = ({ criterioNombre, tareaIndex, nombreActual, onGuardar, onClose, onEliminar }) => {
    const [nombreTarea, setNombreTarea] = useState(nombreActual || '');

    const handleSave = () => {
        if (nombreTarea.trim()) {
            onGuardar(nombreTarea, criterioNombre, tareaIndex);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1060 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <h3 style={{ textAlign: 'center' }}>Asignar Nombre a Trabajo</h3>
                <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#ccc', fontSize: '0.9rem' }}>
                    Asignarás el nombre a la **Tarea {tareaIndex + 1}** del criterio **{criterioNombre}** para **todos** los alumnos.
                </p>

                <input
                    type="text"
                    placeholder={`Nombre del Trabajo ${tareaIndex + 1}`}
                    value={nombreTarea}
                    onChange={e => setNombreTarea(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '1.1rem',
                        borderRadius: '6px',
                        border: '1px solid #555',
                        backgroundColor: '#333',
                        color: 'white',
                    }}
                />

                <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '0' }}>
                    <button className="btn btn-cancel" onClick={onClose}>Cancelar</button>
                    {nombreActual && (
                        <button
                            className="btn btn-danger"
                            onClick={() => onEliminar(criterioNombre, tareaIndex)}
                            style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none' }}
                        >
                            Eliminar
                        </button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!nombreTarea.trim()}
                    >
                        Guardar Nombre
                    </button>
                </div>
            </div>
        </div>
    );
};


// ======================================
// --- COMPONENTE NUEVO: Celda de Calificación (CORREGIDO) ---
// La corrección es la línea 91, que ahora solo pide el nombre si !tareaData.nombre
// ======================================
const CriterioCell = React.memo(({
    alumnoId,
    bimestreActivo,
    criterioNombre,
    tareaIndex,
    calificaciones,
    handleCalificacionChange,
    formatFechaTooltip,
    setTareaPorNombrar,
}) => {
    // La estructura de la data es: { nota: X, fecha: Y, nombre: Z }
    const entrada = calificaciones[alumnoId]?.[bimestreActivo]?.[criterioNombre]?.[tareaIndex];
    const tareaData = entrada || {};

    const handleChange = (e) => {
        const valor = e.target.value;

        // 1. Manejar la entrada de calificación (Llama a la función modificada del padre).
        handleCalificacionChange(alumnoId, bimestreActivo, criterioNombre, tareaIndex, valor);
    };

    // Ajustamos el Tooltip para mostrar el nombre
    const fechaFormatted = formatFechaTooltip(tareaData.fecha);
    const tooltipText = tareaData.nombre ?
        `${tareaData.nombre} (${tareaIndex + 1})\nFecha: ${fechaFormatted}` :
        `Tarea ${tareaIndex + 1}: ${fechaFormatted}`;

    return (
        type = "number"
            min = "5" max = "10" step = "0.1"
    className = "cuadrito-calificacion"
    placeholder = {`${tareaIndex + 1}`
}
            value = { tareaData.nota ?? '' }
            title = { tooltipText }
            onChange = { handleChange }
            onBlur = {() => {
    // Validación al perder foco: Si es número válido y < 5, ajustar a 5
    if (typeof tareaData.nota === 'number' && tareaData.nota < 5) {
        handleCalificacionChange(alumnoId, bimestreActivo, criterioNombre, tareaIndex, 5);
    }
}}
        />
    );
});


// ======================================
// --- 2. Componente Principal: Trabajos ---
// Se encarga de manejar el modal de criterios y las notificaciones para toda la pantalla.
// ======================================
function Trabajos({ user }) {

    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
    const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState(null);

    // Estados levantados de PanelCalificaciones
    const [modalCriterios, setModalCriterios] = useState(false);
    const [criteriosPorBimestre, setCriteriosPorBimestre] = useState({ 1: [], 2: [], 3: [] });
    const [notificacion, setNotificacion] = useState({ mensaje: null, tipo: '' });

    useEffect(() => {
        const fetchGrupos = async () => {
            const token = localStorage.getItem('token');
            const userId = user?._id || user?.id;

            if (!token || !userId) {
                setLoading(false);
                setError("Error de autenticación: Usuario o token no disponible.");
                return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const url = '/grupos/mis-grupos?populate=alumnos,profesoresAsignados.profesor';
                const res = await axios.get(`${API_URL}${url}`, config);
                setGrupos(res.data);
            } catch (err) {
                setError("No se pudieron cargar los grupos.");
                console.error("Error fetching groups:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGrupos();
    }, [user]);

    const handleSeleccionarGrupo = (grupo, asignatura) => {
        setGrupoSeleccionado(grupo);
        setAsignaturaSeleccionada(asignatura);
        // Resetea el estado de criterios para el nuevo grupo/asignatura
        setCriteriosPorBimestre({ 1: [], 2: [], 3: [] });
    };

    const handleVolver = () => {
        setGrupoSeleccionado(null);
        setAsignaturaSeleccionada(null);
    };

    if (loading) return <div className="trabajos-container grupo-componente" style={{ textAlign: 'center', paddingTop: '10rem' }}><p style={{ color: '#E9E9E9' }}>Cargando tus grupos...</p></div>;
    if (error) return <div className="trabajos-container grupo-componente error-mensaje" style={{ textAlign: 'center', paddingTop: '10rem' }}><p>{error}</p></div>;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

                /* ================================================= */
                /* ESTILOS EXCLUSIVOS PARA Trabajos.js               */
                /* ================================================= */

                /* --- FUENTES Y VARIABLES GLOBALES --- */
                .grupo-componente {
                    --dark-color: #191D28;
                    --dark-color-alt: #1E222D;
                    --main-color: #b9972b; /* Tono Dorado/Amarillo formal */
                    --title-color: #FFFFFF;
                    --text-color: #E9E9E9;
                    --danger-color: #d32f2f; /* Rojo formal */
                    --success-color: #27ae60; /* Verde formal */
                    --warning-color: #f39c12; /* Naranja/Amarillo de advertencia */

                    --body-font: 'Poppins', sans-serif;
                    --font-semi-bold: 600;
                    background-color: var(--dark-color);
                    min-height: 100vh;
                }
                /* ... Estilos restantes ... */
                /* CLAVE: Aseguramos que el overlay del modal de criterios esté por encima del Panel */
                .grupo-componente .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 1050; /* Z-INDEX ALTO */
                }
                .notificacion-flotante {
                    /* ... estilos ... */
                    z-index: 2000; /* Z-INDEX MÁS ALTO PARA NOTIFICACIONES */
                    /* ... estilos ... */
                }
                /* ... Estilos restantes (deben ser los mismos que en el ejemplo anterior) ... */
                /* ESTILOS DE TABLA Y BOTONES (SE MANTIENEN IGUAL) */
                .grupo-componente {
                    font-family: var(--body-font);
                    color: var(--text-color);
                }

                .grupo-componente .trabajos-container {
                    padding-top: 8rem;
                    padding-bottom: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding-left: 1rem;
                    padding-right: 1rem;
                }

                .grupo-componente h1, h2, h3 {
                    color: var(--title-color);
                    font-weight: var(--font-semi-bold);
                }

                .grupo-componente .main-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid var(--dark-color-alt);
                    padding-bottom: 1.5rem;
                    width: 100%;
                }
                .grupo-componente .main-header h1 {
                    font-size: 2.5rem;
                }
                .grupo-componente .main-header h2 {
                    font-size: 1.8rem;
                }

                .grupo-componente .subtitulo {
                    text-align: center;
                    margin-bottom: 3rem;
                    font-size: 1.4rem;
                    color: var(--main-color);
                }

                /* --- BOTONES --- */
                .grupo-componente .btn {
                    display: inline-block;
                    padding: 0.8rem 1.5rem;
                    border-radius: .5rem;
                    font-weight: 500;
                    transition: all .3s;
                    cursor: pointer;
                    color: var(--text-color);
                    background-color: #3C414C;
                    border: 1px solid #555;
                }
                .grupo-componente .btn:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                    border-color: var(--main-color);
                }
                .grupo-componente .btn-primary {
                    background-color: var(--main-color);
                    color: var(--dark-color);
                    border-color: var(--main-color);
                    font-weight: 600;
                }
                .grupo-componente .btn-cancel {
                    background-color: #2c3e50;
                    color: white;
                    border-color: #2c3e50;
                }
                .grupo-componente .btn-secondary {
                    background-color: #34495e;
                    color: white;
                    border-color: #34495e;
                }
                .grupo-componente .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    filter: none;
                }

                /* --- TABLA DE SELECCIÓN DE GRUPO --- */
                .grupo-componente .grupos-table-wrapper {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }
                .grupo-componente .grupos-table {
                    width: 90%;
                    max-width: 800px;
                    margin-top: 2rem;
                    border-collapse: separate;
                    border-spacing: 0;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .grupo-componente .grupos-table thead th {
                    background-color: var(--main-color);
                    color: var(--dark-color);
                    padding: 18px 25px;
                    text-align: left;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .grupo-componente .grupos-table tbody td {
                    padding: 15px 25px;
                    border-bottom: 1px solid #333;
                    color: var(--text-color);
                }
                .grupo-componente .grupos-table tbody tr {
                    background-color: var(--dark-color-alt);
                    transition: background-color 0.3s;
                }
                .grupo-componente .grupos-table tbody tr:hover {
                    background-color: #2a2f3c;
                }
                .grupo-componente .grupos-table tbody tr:last-of-type td {
                    border-bottom: none;
                }
                .grupo-componente .grupos-table .acciones-cell {
                    display: flex;
                    gap: 10px;
                }
                .grupo-componente .grupos-table .btn-primary {
                    padding: 0.6rem 1.2rem;
                    font-size: 0.9rem;
                }

                /* ================================================= */
                /* ESTILOS PARA EL PANEL DE CALIFICACIÓN TIPO ASISTENCIA */
                /* ================================================= */

                .grupo-componente .modal-backdrop-solid {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background-color: var(--dark-color);
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    z-index: 1000;
                    padding: 5rem 1rem 2rem 1rem;
                    box-sizing: border-box;
                    overflow-y: auto;
                }

                /* ESTILOS EXCLUSIVOS PARA Trabajos.js               */
                /* ================================================= */

                /* --- FUENTES Y VARIABLES GLOBALES --- */
                .grupo-componente {
                    --dark-color: #191D28;
                    --dark-color-alt: #1E222D;
                    --main-color: #b9972b; /* Tono Dorado/Amarillo formal */
                    --title-color: #FFFFFF;
                    --text-color: #E9E9E9;
                    --danger-color: #d32f2f; /* Rojo formal */
                    --success-color: #27ae60; /* Verde formal */
                    --warning-color: #f39c12; /* Naranja/Amarillo de advertencia */

                    --body-font: 'Poppins', sans-serif;
                    --font-semi-bold: 600;
                    background-color: var(--dark-color);
                    min-height: 100vh;
                }

                /* Base de Modales y Notificaciones (Mantenidas) */
                .grupo-componente .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 1050;
                }
                .notificacion-flotante {
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 2000;
                    padding: 12px 25px; border-radius: 8px; font-weight: 600; font-size: 1rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); opacity: 0; visibility: hidden;
                    animation: fadeInOut 3.5s ease-in-out forwards;
                }
                .notificacion-flotante.exito { background-color: var(--success-color); color: var(--dark-color); border: 1px solid #1a8a49; }
                .notificacion-flotante.error { background-color: var(--danger-color); color: var(--title-color); border: 1px solid #a32222; }
                @keyframes fadeInOut {
                    0% { opacity: 0; visibility: hidden; transform: translate(-50%, -20px); }
                    5% { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
                    90% { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
                    100% { opacity: 0; visibility: hidden; transform: translate(-50%, -20px); }
                }

                /* Estilos de Contenedor y Títulos (Mantenidos) */
                .grupo-componente .trabajos-container { padding-top: 8rem; padding-bottom: 2rem; max-width: 1200px; margin: 0 auto; padding-left: 1rem; padding-right: 1rem; }
                .grupo-componente h1, h2, h3 { color: var(--title-color); font-weight: var(--font-semi-bold); }
                .grupo-componente .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 2px solid var(--dark-color-alt); padding-bottom: 1.5rem; width: 100%; }
                .grupo-componente .main-header h1 { font-size: 2.5rem; }
                .grupo-componente .main-header h2 { font-size: 1.8rem; }
                .grupo-componente .subtitulo { text-align: center; margin-bottom: 3rem; font-size: 1.4rem; color: var(--main-color); }

                /* --- ESTILOS DE BOTONES BASE --- */
                .grupo-componente .btn {
                    display: inline-block; padding: 0.8rem 1.5rem; border-radius: .5rem;
                    font-weight: 500; transition: all .3s; cursor: pointer; color: var(--text-color);
                    background-color: #3C414C; border: 1px solid #555;
                }
                .grupo-componente .btn:hover {
                    filter: brightness(1.1); transform: translateY(-2px); border-color: var(--main-color);
                }
                .grupo-componente .btn-primary {
                    background-color: var(--main-color); color: var(--dark-color);
                    border-color: var(--main-color); font-weight: 600;
                }
                .grupo-componente .btn-cancel {
                    background-color: #2c3e50; color: white; border-color: #2c3e50;
                }
                .grupo-componente .btn-secondary {
                    background-color: #34495e; color: white; border-color: #34495e;
                }
                .grupo-componente .btn:disabled {
                    opacity: 0.6; cursor: not-allowed; transform: none; filter: none;
                }

                /* Estilos de asistencia (Mantenidos) */
                .grupo-componente .modal-backdrop-solid {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: var(--dark-color); display: flex;
                    justify-content: center; align-items: flex-start;
                    z-index: 1000; padding: 5rem 1rem 2rem 1rem; box-sizing: border-box;
                    overflow-y: auto;
                }
                /* ... otros estilos de asistencia (cuadritos, etc.) ... */


                /* ================================================= */
                /* 🎨 MODAL DE CRITERIOS (ENFOQUE EN FORMULARIO Y BOTONES) */
                /* ================================================= */

                .grupo-componente .modal-content {
                    background-color: var(--dark-color-alt);
                    padding: 2.5rem; border-radius: 12px; width: 90%;
                    max-width: 550px; /* Reducido para centralizar */
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                }
                .grupo-componente .modal-content h2 {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    font-size: 1.8rem;
                }
                .grupo-componente .modal-content .bimestre-selector {
                    justify-content: center;
                    border-bottom: none;
                    padding: 0;
                }
                .grupo-componente .modal-content .bimestre-selector .btn {
                    padding: 0.6rem 1.2rem;
                    font-weight: 500;
                    background-color: var(--dark-color);
                    color: var(--text-color);
                    border: 1px solid #444;
                    box-shadow: none;
                    transition: all 0.2s;
                }
                .grupo-componente .modal-content .bimestre-selector .btn-primary {
                    background-color: var(--main-color);
                    color: var(--dark-color);
                    border-color: var(--main-color);
                    font-weight: 700;
                }

                /* Listado de Criterios */
                .grupo-componente h3 {
                    margin-top: 1rem;
                    font-size: 1.3rem;
                    border-bottom: 1px solid #333;
                    padding-bottom: 10px;
                }
                .grupo-componente .criterio-item {
                    background-color: var(--dark-color);
                    border-left: 5px solid var(--main-color);
                    margin-bottom: 8px;
                }
                .grupo-componente .criterio-item button {
                    color: var(--danger-color);
                    background: none; border: none; cursor: pointer;
                    line-height: 1; font-size: 1.4rem;
                    transition: color 0.2s;
                }
                .grupo-componente .criterio-item button:hover {
                    color: #ff5252;
                }

                /* 📌 Formulario de Adición de Criterios (Mejora clave) */
                .grupo-componente .criterio-form {
                    display: flex;
                    gap: 15px; /* Espaciado cómodo */
                    margin: 2rem 0 1.5rem 0;
                    align-items: center;
                }
                .grupo-componente .criterio-form input {
                    /* Estilo base de input más formal */
                    background: var(--dark-color);
                    border: 1px solid #444;
                    border-radius: 6px;
                    color: var(--text-color);
                    padding: 10px 12px;
                    font-size: 1rem;
                    font-weight: 400;
                    box-sizing: border-box;
                }
                .grupo-componente .criterio-form input:focus {
                    border-color: var(--main-color);
                    box-shadow: 0 0 3px rgba(185, 151, 43, 0.8);
                    background-color: #242935;
                }
                .grupo-componente .criterio-form input[type="text"] {
                    flex-grow: 2; /* El nombre toma la mayor parte del espacio */
                    max-width: none;
                }

                /* Wrapper para el input de porcentaje */
                .grupo-componente .porcentaje-wrapper {
                    position: relative;
                    flex-grow: 0;
                    width: 100px; /* Ancho fijo para el porcentaje */
                }
                .grupo-componente .porcentaje-wrapper::after {
                    content: '%';
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #666;
                    pointer-events: none;
                }
                .grupo-componente .criterio-form input[type="number"] {
                    padding-right: 30px;
                    text-align: right;
                }

                /* Botón Añadir */
                .grupo-componente .criterio-form .btn {
                    padding: 10px 15px;
                    font-weight: 600;
                    line-height: 1.4;
                    border-radius: 6px;
                    white-space: nowrap;
                }

                /* Total del Bimestre y Acciones */
                .grupo-componente .criterio-total {
                    text-align: right; font-size: 1.1rem; font-weight: bold;
                    margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #444;
                }
                .grupo-componente .modal-actions {
                    margin-top: 1.5rem;
                }
                .grupo-componente .modal-actions .btn-primary {
                    padding: 0.8rem 1.5rem;
                    transform: none; /* Asegurar que no se mueva en el hover aquí */
                }
                .grupo-componente .modal-actions .btn-cancel {
                    background-color: transparent;
                    color: var(--text-color);
                    border-color: #555;
                    padding: 0.8rem 1.5rem;
                }
                .grupo-componente .modal-actions .btn-cancel:hover {
                    background-color: #2a2f3c;
                    transform: none;
                }



                .grupo-componente .modal-content.asistencia-modal-content {
                    background-color: var(--dark-color-alt);
                    border-radius: 12px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                    padding: 20px;
                    width: 95%;
                    max-width: 1200px;
                    margin: 0;
                }

                .grupo-componente .bimestre-selector {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 2rem;
                    padding: 10px 20px;
                    border-bottom: 1px solid #333;
                }
                .grupo-componente .bimestre-selector .btn {
                    padding: 10px 20px;
                    font-size: 1rem;
                }

                .grupo-componente .asistencia-grid {
                    padding: 1rem 0;
                }

                .grupo-componente .asistencia-body {
                    max-height: 65vh;
                    overflow-y: auto;
                    padding-right: 10px;
                }

                .grupo-componente .asistencia-row {
                    display: grid;
                    grid-template-columns: 450px 1fr 120px;
                    align-items: center;
                    padding: 10px 20px;
                    background-color: var(--dark-color);
                    border-radius: 8px;
                    border-bottom: 1px solid var(--dark-color-alt);
                    margin-bottom: 5px;
                }
                .grupo-componente .asistencia-row:hover {
                    background-color: #2a2f3c;
                }

                .grupo-componente .alumno-nombre {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-weight: 500;
                    font-size: 1.1rem;
                    color: var(--title-color);
                }

                .grupo-componente .bimestres-container {
                    display: flex;
                    flex-grow: 1;
                    justify-content: flex-start;
                    gap: 10px;
                }

                .grupo-componente .bimestre-header-btn {
                    text-align: center;
                    padding: 6px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s;
                    background-color: var(--dark-color-alt);
                    color: var(--text-color);
                    font-size: 0.85rem;
                    white-space: nowrap;
                    border: 1px solid #444;
                }
                .grupo-componente .bimestre-header-btn:hover {
                    border-color: var(--main-color);
                    filter: brightness(1.2);
                }
                .grupo-componente .bimestre-header-btn.activo {
                    background-color: var(--main-color);
                    color: var(--dark-color);
                    font-weight: bold;
                    border-color: var(--main-color);
                    box-shadow: 0 0 8px rgba(185, 151, 43, 0.7);
                }

                .grupo-componente .promedio-final-display {
                    width: 120px;
                    flex-shrink: 0;
                    text-align: right;
                    font-weight: bold;
                    font-size: 1.2rem;
                    color: var(--main-color);
                }

                .grupo-componente .bimestre-desplegable {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.4s ease-out, padding 0.4s ease-out, margin 0.4s ease-out;
                    padding: 0 20px;
                    margin: 0;
                    background-color: var(--dark-color-alt);
                    border-radius: 8px;
                    grid-column: 1 / -1;
                }
                .grupo-componente .bimestre-desplegable.desplegado {
                    max-height: 500px;
                    padding: 20px;
                    margin: 5px 0 10px 0;
                }

                .grupo-componente .criterio-resumen-wrapper {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                    margin-bottom: 20px;
                }
                .grupo-componente .criterio-resumen {
                    background-color: var(--main-color);
                    color: var(--dark-color);
                    font-weight: bold;
                    padding: 12px 25px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    text-align: center;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }
                .grupo-componente .criterio-resumen .criterio-info {
                    flex-grow: 1;
                    text-align: left;
                    font-size: 1rem;
                }
                .grupo-componente .criterio-resumen .criterio-prom {
                    font-size: 1.3em;
                    margin-left: 10px;
                }

                .grupo-componente .cuadritos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                    gap: 8px;
                    align-items: center;
                    padding: 10px 0;
                }

                .grupo-componente .cuadrito-calificacion {
                    width: 60px;
                    height: 38px;
                    background-color: #4a4a4a;
                    border: 1px solid #777;
                    border-radius: 6px;
                    color: white;
                    text-align: center;
                    font-weight: 600;
                    font-family: var(--body-font);
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                .grupo-componente .cuadrito-calificacion::placeholder {
                    color: #999;
                    font-size: 0.9em;
                }
                .grupo-componente .cuadrito-calificacion:focus {
                    outline: 2px solid var(--main-color);
                    background-color: #5f5f5f;
                }
                .grupo-componente .cuadrito-calificacion::-webkit-outer-spin-button,
                .grupo-componente .cuadrito-calificacion::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }

                .grupo-componente .btn-agregar-dias {
                    background-color: #34495e;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    width: 60px;
                    height: 38px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s, background-color 0.2s;
                    font-size: 1.1rem;
                }
                .grupo-componente .btn-agregar-dias:hover {
                    transform: scale(1.05);
                    background-color: #4b6587;
                }

                /* --- TASK HEADERS --- */
                .grupo-componente .task-header-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                    gap: 8px;
                    margin-bottom: 5px;
                    padding-right: 68px; /* Space for the +5 button */
                }

                .grupo-componente .task-header-cell {
                    width: 60px;
                    font-size: 0.7rem;
                    text-align: center;
                    color: #aaa;
                    cursor: pointer;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: color 0.2s;
                }
                .grupo-componente .task-header-cell:hover {
                    color: var(--main-color);
                    font-weight: bold;
                }
                .grupo-componente .task-header-cell.named {
                    color: var(--main-color);
                    font-weight: 600;
                }

                /* --- MODAL DE CRITERIOS (CON NUEVOS ESTILOS) --- */
                .grupo-componente .modal-content {
                    background-color: var(--dark-color-alt);
                    padding: 2.5rem; border-radius: 12px; width: 90%;
                    max-width: 650px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                }
                .grupo-componente .modal-content h2 {
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 1.6rem;
                }

                .grupo-componente .modal-actions {
                    display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;
                }

                .grupo-componente .criterio-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: var(--dark-color);
                    padding: 12px 20px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    border-left: 5px solid var(--main-color);
                }
                .grupo-componente .criterio-item span {
                    font-size: 1rem;
                }
                .grupo-componente .criterio-item span strong {
                    color: var(--main-color);
                    font-size: 1.1rem;
                }
                .grupo-componente .criterio-item button {
                    color: var(--danger-color);
                    width: 30px;
                    height: 30px;
                    font-size: 1.5rem;
                }

                /* MEJORA: Formulario de adición de criterios */
                .grupo-componente .criterio-form {
                    display: flex;
                    gap: 10px; /* Reducimos el espacio */
                    margin: 2rem 0 1rem 0;
                    align-items: center;
                }
                /* MEJORA: Inputs más grandes y visualmente impactantes */
                .grupo-componente .criterio-form input {
                    background: var(--dark-color);
                    border: 2px solid #555; /* Borde más grueso */
                    border-radius: 8px;
                    color: var(--text-color);
                    padding: 14px 12px; /* Mayor padding vertical */
                    box-sizing: border-box;
                    font-size: 1.05rem; /* Letra un poco más grande */
                    font-weight: 500;
                }
                .grupo-componente .criterio-form input:focus {
                    border-color: var(--main-color);
                    box-shadow: 0 0 5px rgba(185, 151, 43, 0.5); /* Sombra al enfocar */
                }

                .grupo-componente .porcentaje-wrapper {
                    position: relative;
                    flex-grow: 1;
                    max-width: 120px; /* Reducimos el ancho para que el botón "Añadir" quepa mejor */
                }
                .grupo-componente .porcentaje-wrapper::after {
                    content: '%';
                    position: absolute;
                    right: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #888;
                    pointer-events: none;
                }
                .grupo-componente .criterio-form input[type="number"] {
                    padding-right: 35px;
                    text-align: center; /* Centramos el porcentaje */
                }
                /* MEJORA: Botón Añadir más llamativo y con el color principal */
                .grupo-componente .criterio-form .btn {
                    padding: 14px 25px; /* Más ancho para que no se vea apretado */
                    background-color: var(--main-color);
                    color: var(--dark-color);
                    font-weight: 700; /* Botón de acción principal muy visible */
                    border: none;
                    border-radius: 8px;
                    line-height: 1;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3); /* Sombra más suave */
                    transition: background-color 0.2s, transform 0.2s;
                    margin-left: 10px; /* Separación extra */
                }
                .grupo-componente .criterio-form .btn:hover {
                    background-color: #d4b03f;
                    transform: none
                }
                .grupo-componente .criterio-total {
                    text-align: right; font-size: 1.3rem; font-weight: bold;
                    margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #444;
                    color: var(--text-color);
                }
                .grupo-componente .criterio-total.error {
                    color: var(--danger-color);
                }
                .grupo-componente .criterio-total strong {
                    color: var(--main-color);
                }
                .grupo-componente .criterio-total.error strong {
                    color: var(--danger-color);
                }

                .grupo-componente .aviso-criterios {
                    text-align: center; padding: 3rem; background-color: var(--dark-color);
                    border-radius: 12px; margin: 2rem;
                    border: 2px dashed var(--warning-color);
                    box-shadow: 0 0 15px rgba(243, 156, 18, 0.2);
                }
                .grupo-componente .aviso-criterios p {
                    margin-bottom: 2rem; font-size: 1.2rem; color: var(--warning-color);
                }

                /* --- ESTILOS DE SCROLLBAR (Mejorados) --- */
                .grupo-componente .asistencia-body::-webkit-scrollbar {
                    display: none;
                }
                .grupo-componente .asistencia-body {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .grupo-componente .modal-backdrop-solid::-webkit-scrollbar {
                    width: 8px;
                }
                .grupo-componente .modal-backdrop-solid::-webkit-scrollbar-track {
                    background: var(--dark-color-alt);
                }
                .grupo-componente .modal-backdrop-solid::-webkit-scrollbar-thumb {
                    background-color: var(--main-color);
                    border-radius: 10px;
                    border: 2px solid var(--dark-color-alt);
                }
                .grupo-componente .modal-backdrop-solid::-webkit-scrollbar-thumb:hover {
                    background-color: #d4b03f;
                }
            `}</style>
            <div className="trabajos-container grupo-componente">
                {!grupoSeleccionado ? (
                    <ListaDeGrupos grupos={grupos} user={user} onSeleccionarGrupo={handleSeleccionarGrupo} />
                ) : (
                    <PanelCalificaciones
                        grupo={grupoSeleccionado}
                        asignatura={asignaturaSeleccionada}
                        onVolver={handleVolver}
                        setModalCriterios={setModalCriterios} // Pasa la función para abrir el modal
                        criteriosPorBimestre={criteriosPorBimestre} // Pasa el estado para consumo
                        setCriteriosPorBimestre={setCriteriosPorBimestre} // Pasa la función para actualizar
                        setNotificacion={setNotificacion} // Pasa la función para notificar
                        user={user} // ✅ CORRECCIÓN: Pasar la prop user para eliminar el error de compilación
                    />
                )}
            </div>
            {/* 1. Notificación en el nivel superior */}
            <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: null, tipo: '' })} />

            {/* 2. Modal de Criterios en el nivel superior (para evitar problemas de z-index) */}
            {modalCriterios && (
                <ModalCriterios
                    criteriosPorBimestre={criteriosPorBimestre}
                    onGuardar={setCriteriosPorBimestre}
                    onClose={() => setModalCriterios(false)}
                    setNotificacion={setNotificacion}
                />
            )}
        </>
    );
}


// ======================================
// --- 3. Sub-componente: Panel Principal de Calificaciones (MODIFICADO) ---
// ======================================
const PanelCalificaciones = ({
    grupo,
    asignatura,
    onVolver,
    setModalCriterios,
    criteriosPorBimestre,
    setCriteriosPorBimestre,
    setNotificacion,
    user // ✅ CORRECCIÓN: Recibir la prop user
}) => {
    const [bimestreActivo, setBimestreActivo] = useState(1);
    const [calificaciones, setCalificaciones] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [criterioAbierto, setCriterioAbierto] = useState(null);
    const [numTareas, setNumTareas] = useState({});
    // 🌟 ESTADO AGREGADO: Para controlar cuándo y qué tarea necesita un nombre.
    const [tareaPorNombrar, setTareaPorNombrar] = useState(null);
    // 🌟 ESTADO AGREGADO: Para el modal de confirmación personalizado
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

    // Obtener los criterios del bimestre activo
    const criteriosActivos = criteriosPorBimestre[bimestreActivo] || [];


    useEffect(() => {
        const fetchGrupos = async () => {
            const token = localStorage.getItem('token');
            const userId = user?._id || user?.id; // Este uso es ahora correcto
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (!token || !userId) {
                setIsLoadingData(false);
                setNotificacion({ mensaje: 'Error de autenticación: Token no disponible.', tipo: 'error' });
                return;
            }

            try {
                const url = `${API_URL}/calificaciones?grupoId=${grupo._id}&asignatura=${asignatura}`;
                const res = await axios.get(url, config);

                // AJUSTE CLAVE: Se actualizan los criterios en el padre (Trabajos)
                const fetchedCriterios = {
                    1: res.data?.criterios?.[1] || [],
                    2: res.data?.criterios?.[2] || [],
                    3: res.data?.criterios?.[3] || [],
                };
                setCriteriosPorBimestre(fetchedCriterios);

                setCalificaciones(res.data?.calificaciones || {});

                // Lógica de numTareas (se mantiene igual, ajustando para la nueva estructura)
                const allCriterios = [...fetchedCriterios[1], ...fetchedCriterios[2], ...fetchedCriterios[3]];

                const initialNumTareas = allCriterios.reduce((acc, criterio) => {
                    let maxIndex = 0;
                    Object.values(res.data?.calificaciones || {}).forEach(alumnoCal => {
                        Object.values(alumnoCal).forEach(bimestreCal => {
                            const tareas = bimestreCal[criterio.nombre];
                            if (tareas) {
                                const currentMax = Math.max(...Object.keys(tareas).map(Number));
                                if (currentMax >= maxIndex) maxIndex = currentMax + 1;
                            }
                        });
                    });
                    acc[criterio.nombre] = Math.max(10, maxIndex + 5);
                    return acc;
                }, {});

                setNumTareas(initialNumTareas);

                // Abrir el modal de criterios si el bimestre 1 no tiene ninguno.
                if (fetchedCriterios[1]?.length === 0) {
                    setModalCriterios(true);
                }
            } catch (error) {
                // Notificación de error si la carga falla
                setNotificacion({ mensaje: 'Error al cargar los datos de calificaciones.', tipo: 'error' });
            } finally {
                setIsLoadingData(false);
            }
        };
        if (grupo && asignatura) fetchGrupos();
        // Dependencias ajustadas
    }, [grupo, asignatura, setCriteriosPorBimestre, setModalCriterios, setNotificacion, user]);


    // 🌟 FUNCIÓN CLAVE: Asigna el nombre de la tarea a todos los alumnos en la columna.
    const handleGuardarNombreTarea = (tareaNombre, criterioNombre, tareaIndex) => {
        if (!tareaNombre.trim()) return;

        const nuevoNombre = tareaNombre.trim();
        const alumnosIds = grupo.alumnos.map(a => a._id);

        setCalificaciones(prev => {
            const nextCalificaciones = { ...prev };

            alumnosIds.forEach(alumnoId => {
                const alumnoCal = nextCalificaciones[alumnoId] || {};
                const bimestreCal = alumnoCal[bimestreActivo] || {};
                const criterioCal = bimestreCal[criterioNombre] || {};
                const tareaCal = criterioCal[tareaIndex] || {};

                // Mantenemos la nota y la fecha si ya existen, y solo agregamos/actualizamos el nombre.
                const notaExistente = tareaCal?.nota !== undefined ? tareaCal.nota : null;

                nextCalificaciones[alumnoId] = {
                    ...alumnoCal,
                    [bimestreActivo]: {
                        ...bimestreCal,
                        [criterioNombre]: {
                            ...criterioCal,
                            [tareaIndex]: {
                                nota: notaExistente, // Mantenemos la nota
                                fecha: tareaCal.fecha || new Date().toISOString(), // Mantenemos la fecha o la actual si hay nota
                                nombre: nuevoNombre // 🎯 Guardamos el nombre aquí para todos los alumnos
                            }
                        },
                    },
                };
            });
            return nextCalificaciones;
        });

        setTareaPorNombrar(null); // Cerrar el modal
        setNotificacion({ mensaje: `Se asignó el nombre "${nuevoNombre}" a la Tarea ${tareaIndex + 1}.`, tipo: 'exito' });
    };

    // 🌟 FUNCIÓN NUEVA: Eliminar nombre y calificaciones de una columna
    const handleEliminarTarea = (criterioNombre, tareaIndex) => {
        const alumnosIds = grupo.alumnos.map(a => a._id);

        setCalificaciones(prev => {
            const nextCalificaciones = { ...prev };
            alumnosIds.forEach(alumnoId => {
                if (nextCalificaciones[alumnoId]?.[bimestreActivo]?.[criterioNombre]?.[tareaIndex]) {
                    // Opción A: Eliminar completamente la entrada
                    delete nextCalificaciones[alumnoId][bimestreActivo][criterioNombre][tareaIndex];

                    // Opción B: Si quisieras solo borrar el nombre pero dejar la nota, harías:
                    // nextCalificaciones[alumnoId][bimestreActivo][criterioNombre][tareaIndex].nombre = null;
                }
            });
            return nextCalificaciones;
        });

        setTareaPorNombrar(null);
        setNotificacion({ mensaje: `Se eliminó la Tarea ${tareaIndex + 1} y sus calificaciones.`, tipo: 'exito' });
    };


    // Lógica de manipulación de calificaciones (MODIFICADA para preservar el nombre)
    const handleCalificacionChange = (alumnoId, bimestre, criterioNombre, tareaIndex, valor) => {
        const notaFloat = valor === '' ? null : parseFloat(valor);
        if (notaFloat !== null && (isNaN(notaFloat) || notaFloat < 0 || notaFloat > 10)) return;

        // Obtenemos el nombre y la fecha del trabajo si ya existen para no perderlos
        const datosAnteriores = calificaciones[alumnoId]?.[bimestre]?.[criterioNombre]?.[tareaIndex] || {};

        // Si se ingresa una nota, usamos la fecha anterior o la actual, si se borra, es null.
        const nuevaEntrada = notaFloat === null ? null : {
            nota: notaFloat,
            fecha: datosAnteriores.fecha || new Date().toISOString(),
            nombre: datosAnteriores.nombre // Mantenemos el nombre si ya fue asignado
        };

        setCalificaciones(prev => ({
            ...prev,
            [alumnoId]: {
                ...prev[alumnoId],
                [bimestre]: {
                    ...prev[alumnoId]?.[bimestre],
                    [criterioNombre]: {
                        ...prev[alumnoId]?.[bimestre]?.[criterioNombre],
                        [tareaIndex]: nuevaEntrada,
                    },
                },
            },
        }));
    };

    const guardarCalificaciones = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Envía el objeto de criterios completo, separado por bimestre, que viene del estado del padre.
        const payload = { grupoId: grupo._id, asignatura, criterios: criteriosPorBimestre, calificaciones };
        try {
            await axios.post(`${API_URL}/calificaciones`, payload, config);
            setNotificacion({ mensaje: '¡Calificaciones guardadas con éxito!', tipo: 'exito' });
        } catch (error) {
            setNotificacion({ mensaje: 'Error al guardar las calificaciones.', tipo: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const calcularPromedioCriterio = (alumnoId, bimestre, criterioNombre) => {
        const tareas = calificaciones[alumnoId]?.[bimestre]?.[criterioNombre] || {};
        const notasValidas = Object.values(tareas)
            .filter(entrada => entrada && typeof entrada.nota === 'number')
            .map(entrada => entrada.nota);

        if (notasValidas.length === 0) return 0;
        const total = notasValidas.reduce((sum, nota) => sum + nota, 0);
        return total / notasValidas.length;
    };

    const calcularPromedioBimestre = (alumnoId, bimestre) => {
        const criteriosDelBimestre = criteriosPorBimestre[bimestre] || [];
        if (criteriosDelBimestre.length === 0) return 0;

        let sumaPonderada = 0;
        let pesoTotalAplicable = 0;

        criteriosDelBimestre.forEach(criterio => {
            // Verificar si este criterio tiene calificaciones válidas
            const tareas = calificaciones[alumnoId]?.[bimestre]?.[criterio.nombre] || {};
            const tieneNotas = Object.values(tareas).some(entrada => entrada && typeof entrada.nota === 'number');

            if (tieneNotas) {
                const promCriterio = calcularPromedioCriterio(alumnoId, bimestre, criterio.nombre);
                sumaPonderada += promCriterio * (criterio.porcentaje / 100);
                pesoTotalAplicable += (criterio.porcentaje / 100);
            }
        });

        // Si no hay ningún criterio con notas, retornamos 0 (o podría ser '-' visualmente, pero aquí necesitamos número)
        if (pesoTotalAplicable === 0) return 0;

        // Regla de tres simple: Si sumaPonderada es a pesoTotalAplicable, X es a 1 (100%)
        // Ejemplo: Si Examen vale 50% y tiene 10. Tareas vale 50% y no tiene nada.
        // sumaPonderada = 10 * 0.5 = 5. pesoTotalAplicable = 0.5.
        // Resultado = 5 / 0.5 = 10. Correcto.
        const promedioFinal = sumaPonderada / pesoTotalAplicable;

        return Math.round(promedioFinal); // Redondeo estándar (o usar Math.floor/ceil según preferencia)
        // return Math.round(promedioFinal * 10) / 10; // Para 1 decimal si se prefiere
    };

    const formatFechaTooltip = (fechaISO) => {
        if (!fechaISO) return "Sin calificar";
        try {
            return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) { return "Fecha inválida"; }
    };

    const handleToggleCriterio = (alumnoId, criterioNombre) => {
        const esElMismo = criterioAbierto?.alumnoId === alumnoId && criterioAbierto?.criterioNombre === criterioNombre;
        setCriterioAbierto(esElMismo ? null : { alumnoId, criterioNombre });
    };

    const agregarTareas = (criterioNombre) => {
        setNumTareas(prev => ({ ...prev, [criterioNombre]: (prev[criterioNombre] || 10) + 5 }));
    };

    // 🌟 FUNCIÓN NUEVA: Generar Reporte PDF de la Asignatura
    const generateSubjectReport = async () => {
        const doc = new jsPDF();

        // --- LOGO Y ENCABEZADO (Reutilizado de Calificaciones.js) ---
        const img = new Image();
        img.src = logoImage;
        await img.decode();
        const logoWidth = 25, margin = 14;
        const logoHeight = (img.height * logoWidth) / img.width;
        const pageWidth = doc.internal.pageSize.width;
        doc.addImage(logoImage, 'PNG', pageWidth - margin - logoWidth, margin - 5, logoWidth, logoHeight);

        doc.setFontSize(12);
        let yPos = margin + 5;
        doc.text('Escuela Secundaria No. 9 "Amado Nervo"', margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'bold');
        doc.text('Reporte de Calificaciones por Asignatura', margin, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 7;
        doc.text(`Grupo: ${grupo.nombre}`, margin, yPos);
        yPos += 7;
        doc.text(`Asignatura: ${asignatura}`, margin, yPos);
        yPos += 5;

        // --- TABLA ---
        const tableHeaders = [['Nombre del Alumno', 'T1', 'T2', 'T3', 'Promedio Final']];

        const tableBody = grupo.alumnos.sort((a, b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)).map(alumno => {
            const nombreCompleto = `${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''} ${alumno.nombre}`;

            // Calcular promedios
            const p1 = calcularPromedioBimestre(alumno._id, 1);
            const p2 = calcularPromedioBimestre(alumno._id, 2);
            const p3 = calcularPromedioBimestre(alumno._id, 3);

            // Calcular final
            let suma = 0;
            let count = 0;
            if (p1 > 0) { suma += parseFloat(p1); count++; }
            if (p2 > 0) { suma += parseFloat(p2); count++; }
            if (p3 > 0) { suma += parseFloat(p3); count++; }
            const final = count > 0 ? Math.round(suma / count) : 0;

            return [
                nombreCompleto,
                p1 > 0 ? p1 : '-',
                p2 > 0 ? p2 : '-',
                p3 > 0 ? p3 : '-',
                final > 0 ? final : '-'
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: tableHeaders,
            body: tableBody,
            theme: 'grid',
            styles: { halign: 'center', cellPadding: 2.5 },
            headStyles: { fillColor: [185, 151, 43], textColor: 255 }, // Color dorado del tema
            columnStyles: { 0: { halign: 'left' } }
        });

        doc.save(`Reporte_${grupo.nombre}_${asignatura.replace(/\s/g, '_')}.pdf`);
    };

    // 🌟 FUNCIÓN NUEVA: Limpiar Calificaciones
    const handleLimpiarCalificaciones = () => {
        setConfirmModal({
            isOpen: true,
            message: `¿Estás SEGURO de que quieres eliminar TODAS las calificaciones de ${asignatura} para el grupo ${grupo.nombre}? Esta acción NO se puede deshacer.`,
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                try {
                    const calificacionesVacias = {};
                    const payload = {
                        grupoId: grupo._id,
                        asignatura,
                        criterios: criteriosPorBimestre,
                        calificaciones: calificacionesVacias
                    };

                    await axios.post(`${API_URL}/calificaciones`, payload, config);

                    setCalificaciones({});
                    setNotificacion({ mensaje: 'Se han eliminado todas las calificaciones de esta asignatura.', tipo: 'exito' });
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null }); // Cerrar modal

                } catch (error) {
                    console.error("Error al limpiar calificaciones:", error);
                    setNotificacion({ mensaje: 'Error al intentar limpiar las calificaciones.', tipo: 'error' });
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null }); // Cerrar modal en error también
                }
            }
        });
    };


    if (isLoadingData) return <div className="trabajos-container grupo-componente" style={{ textAlign: 'center', paddingTop: '10rem' }}><p style={{ color: '#E9E9E9' }}>Cargando datos del grupo...</p></div>;


    return (
        <div className="modal-backdrop-solid grupo-componente">
            {/* 🌟 Invocación del ModalNombreTarea */}
            {tareaPorNombrar && (
                <ModalNombreTarea
                    criterioNombre={tareaPorNombrar.criterioNombre}
                    tareaIndex={tareaPorNombrar.tareaIndex}
                    nombreActual={tareaPorNombrar.nombreActual} // Pasar nombre actual
                    onGuardar={handleGuardarNombreTarea}
                    onEliminar={handleEliminarTarea} // Pasar función de eliminar
                    onClose={() => setTareaPorNombrar(null)}
                />
            )}

            {/* 🌟 Modal de Confirmación Personalizado */}
            <ConfirmacionModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                mensaje={confirmModal.message}
                confirmText="Sí, Eliminar Todo"
            />
            {/* Contenido principal del panel de calificaciones */}
            <div className="asistencia-modal-content">
                <header className="main-header" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
                    <h2>Calificaciones: {grupo.nombre} - {asignatura}</h2>
                    <div>
                        {/* Botones de Acción Nuevos */}
                        <button className="btn" onClick={generateSubjectReport} style={{ marginRight: '10px', backgroundColor: '#2980b9', borderColor: '#2980b9', color: 'white' }}>
                            📄 Reporte PDF
                        </button>
                        <button className="btn" onClick={handleLimpiarCalificaciones} style={{ marginRight: '10px', backgroundColor: '#c0392b', borderColor: '#c0392b', color: 'white' }}>
                            🗑️ Limpiar Calificaciones
                        </button>

                        {/* Botón para abrir el modal de criterios */}
                        <button className="btn" onClick={() => setModalCriterios(true)}>Criterios</button>
                        <button className="btn btn-cancel" onClick={onVolver} style={{ marginLeft: '10px' }}>Cerrar</button>
                    </div>
                </header>
                <div className="bimestre-selector">
                    {[1, 2, 3].map(bim => (
                        <button key={bim} className={`btn ${bimestreActivo === bim ? 'btn-primary' : ''}`} onClick={() => setBimestreActivo(bim)}>Trimestre {bim}</button>
                    ))}
                </div>

                {criteriosActivos.length > 0 ? (
                    <div className="asistencia-grid">
                        <div className="asistencia-body">
                            {grupo.alumnos.sort((a, b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)).map(alumno => (
                                <React.Fragment key={alumno._id}>
                                    <div className="asistencia-row">
                                        <div className="alumno-nombre">{`${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''} ${alumno.nombre}`}</div>
                                        <div className="bimestres-container">
                                            {criteriosActivos.map(criterio => (
                                                <div
                                                    key={criterio.nombre}
                                                    className={`bimestre-header-btn ${criterioAbierto?.alumnoId === alumno._id && criterioAbierto?.criterioNombre === criterio.nombre ? 'activo' : ''}`}
                                                    onClick={() => handleToggleCriterio(alumno._id, criterio.nombre)}
                                                >
                                                    {criterio.nombre} ({criterio.porcentaje}%)
                                                </div>
                                            ))}
                                        </div>
                                        <div className="promedio-final-display" style={{ color: calcularPromedioBimestre(alumno._id, bimestreActivo) >= 6 ? '#27ae60' : '#d32f2f' }}>
                                            Prom: {calcularPromedioBimestre(alumno._id, bimestreActivo)}
                                        </div>
                                    </div>
                                    {criterioAbierto?.alumnoId === alumno._id && (
                                        <div className={`bimestre-desplegable desplegado`}>
                                            <div className="criterio-resumen-wrapper">
                                                <div className="criterio-resumen">
                                                    <span className="criterio-info">
                                                        {criterioAbierto.criterioNombre} ({criteriosActivos.find(c => c.nombre === criterioAbierto.criterioNombre)?.porcentaje}%)
                                                    </span>
                                                    <span className="criterio-prom" style={{ color: calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre) >= 6 ? 'var(--dark-color)' : 'var(--danger-color)' }}>
                                                        Prom: {calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="cuadritos-grid">
                                                {/* 🌟 HEADER ROW PARA TAREAS */}
                                                <div className="task-header-row" style={{ gridColumn: '1 / -1' }}>
                                                    {Array.from({ length: numTareas[criterioAbierto.criterioNombre] || 10 }).map((_, tareaIndex) => {
                                                        // Buscar si alguna calificación en esta columna tiene nombre
                                                        const nombreTarea = Object.values(calificaciones).find(
                                                            alumnoCal => alumnoCal?.[bimestreActivo]?.[criterioAbierto.criterioNombre]?.[tareaIndex]?.nombre
                                                        )?.[bimestreActivo]?.[criterioAbierto.criterioNombre]?.[tareaIndex]?.nombre;

                                                        return (
                                                            <div
                                                                key={tareaIndex}
                                                                className={`task-header-cell ${nombreTarea ? 'named' : ''}`}
                                                                title={nombreTarea || `Tarea ${tareaIndex + 1}`}
                                                                onClick={() => setTareaPorNombrar({
                                                                    criterioNombre: criterioAbierto.criterioNombre,
                                                                    tareaIndex,
                                                                    nombreActual: nombreTarea
                                                                })}
                                                            >
                                                                {nombreTarea || `T${tareaIndex + 1}`}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* 🌟 Uso del nuevo componente CriterioCell */}
                                                {Array.from({ length: numTareas[criterioAbierto.criterioNombre] || 10 }).map((_, tareaIndex) => (
                                                    <CriterioCell
                                                        key={tareaIndex}
                                                        alumnoId={alumno._id}
                                                        bimestreActivo={bimestreActivo}
                                                        criterioNombre={criterioAbierto.criterioNombre}
                                                        tareaIndex={tareaIndex}
                                                        calificaciones={calificaciones}
                                                        handleCalificacionChange={handleCalificacionChange}
                                                        formatFechaTooltip={formatFechaTooltip}
                                                        setTareaPorNombrar={setTareaPorNombrar}
                                                    />
                                                ))}
                                                <button className="btn btn-agregar-dias" onClick={() => agregarTareas(criterioAbierto.criterioNombre)}>+5</button>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="aviso-criterios"><p>⚠️ Por favor, define los criterios de evaluación para el **Trimestre {bimestreActivo}**.</p></div>
                )}
                <div className="modal-actions" style={{ padding: '0 20px' }}>
                    <button className="btn btn-primary" onClick={guardarCalificaciones} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Calificaciones'}</button>
                </div>
            </div>
        </div>
    );
};

// ======================================
// --- 4. Componente: Lista de Grupos (Original) ---
// ======================================
const ListaDeGrupos = ({ grupos, user, onSeleccionarGrupo }) => {
    const userId = user?._id || user?.id;

    return (
        <>
            <header className="main-header" style={{ justifyContent: 'center', paddingTop: '0' }}><h1>Gestión de Calificaciones</h1></header>
            <h3 className="subtitulo">Selecciona un grupo y asignatura para calificar</h3>

            <div className="grupos-table-wrapper">
                <table className="grupos-table">
                    <thead><tr><th>Grupo</th><th>Mi Asignatura</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {grupos.flatMap(grupo => {
                            // Filtrar todas las asignaciones para este profesor
                            const misAsignaciones = grupo.profesoresAsignados.filter(asig => asig.profesor?._id === userId);

                            // Retornar una fila por cada asignatura asignada
                            return misAsignaciones.map((asignacion, index) => (
                                <tr key={`${grupo._id}-${index}`}>
                                    <td>{grupo.nombre}</td>
                                    <td>{asignacion.asignatura}</td>
                                    <td className="acciones-cell">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => onSeleccionarGrupo(grupo, asignacion.asignatura)}
                                        >
                                            Calificar
                                        </button>
                                    </td>
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ======================================
// --- 5. Componente: Modal para Criterios de Evaluación (Original) ---
// ======================================
const ModalCriterios = ({ criteriosPorBimestre, onGuardar, onClose, setNotificacion }) => {
    // 1. Estado para manejar los criterios internamente, clonando el prop inicial.
    const [criteriosLocales, setCriteriosLocales] = useState(criteriosPorBimestre || { 1: [], 2: [], 3: [] });
    // 2. Estado para el bimestre actualmente seleccionado en el modal.
    const [bimestreActivo, setBimestreActivo] = useState(1);
    const [nombre, setNombre] = useState('');
    const [porcentaje, setPorcentaje] = useState('');

    // Criterios del bimestre activo
    const criteriosDelBimestre = criteriosLocales[bimestreActivo] || [];
    const totalPorcentaje = criteriosDelBimestre.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

    // Función para cambiar de bimestre y verificar si el actual suma 100%
    const handleSetBimestre = (bim) => {
        if (criteriosDelBimestre.length > 0 && totalPorcentaje !== 100) {
            setNotificacion({
                mensaje: `El Trimestre ${bimestreActivo} tiene criterios definidos (${totalPorcentaje}%). Por favor, ajústalo a 100% antes de cambiar.`,
                tipo: 'error'
            });
            return;
        }
        setBimestreActivo(bim);
    };

    // Función para añadir un criterio al bimestre activo
    const addCriterio = () => {
        const porciento = parseInt(porcentaje, 10);

        if (!nombre.trim() || isNaN(porciento) || porciento <= 0 || totalPorcentaje + porciento > 100) {
            setNotificacion({
                mensaje: 'Verifica los datos. El porcentaje debe ser positivo y el total no debe exceder 100%.',
                tipo: 'error'
            });
            return;
        }

        if (criteriosDelBimestre.some(c => c.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
            setNotificacion({
                mensaje: 'Ya existe un criterio con ese nombre en este trimestre.',
                tipo: 'error'
            });
            return;
        }

        const nuevoCriterio = { nombre: nombre.trim(), porcentaje: porciento };

        setCriteriosLocales(prev => ({
            ...prev,
            [bimestreActivo]: [...criteriosDelBimestre, nuevoCriterio]
        }));

        setNombre('');
        setPorcentaje('');
    };

    // Función para eliminar un criterio del bimestre activo
    const removeCriterio = (index) => {
        const nuevosCriterios = criteriosDelBimestre.filter((_, i) => i !== index);
        setCriteriosLocales(prev => ({
            ...prev,
            [bimestreActivo]: nuevosCriterios
        }));
    };

    // Función principal de guardado
    const handleGuardar = () => {
        for (const [bimestre, criterios] of Object.entries(criteriosLocales)) {
            const totalBimestre = criterios.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
            if (criterios.length > 0 && totalBimestre !== 100) {
                setNotificacion({
                    mensaje: `ERROR: El Trimestre ${bimestre} debe sumar exactamente 100% para guardar. Actualmente suma ${totalBimestre}%.`,
                    tipo: 'error'
                });
                return;
            }
        }

        onGuardar(criteriosLocales);
        onClose();
        setNotificacion({ mensaje: 'Criterios de evaluación actualizados.', tipo: 'exito' });
    };

    // Función para copiar los criterios de un bimestre anterior (ej. 1 -> 2)
    const handleCopiarCriterios = (bimestreOrigen, bimestreDestino) => {
        const criteriosOrigen = criteriosLocales[bimestreOrigen];
        if (!criteriosOrigen || criteriosOrigen.length === 0) {
            setNotificacion({ mensaje: `No hay criterios definidos en el Trimestre ${bimestreOrigen}.`, tipo: 'error' });
            return;
        }

        const totalOrigen = criteriosOrigen.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
        if (totalOrigen !== 100) {
            setNotificacion({ mensaje: `El Trimestre ${bimestreOrigen} debe sumar 100% antes de ser copiado.`, tipo: 'error' });
            return;
        }

        setCriteriosLocales(prev => ({
            ...prev,
            [bimestreDestino]: criteriosOrigen.map(c => ({ ...c }))
        }));
        setBimestreActivo(bimestreDestino);
        setNotificacion({ mensaje: `Criterios del Trimestre ${bimestreOrigen} copiados a Trimestre ${bimestreDestino}.`, tipo: 'exito' });
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
            {/* WRAPPER CLAVE: Aplicamos la clase grupo-componente aquí para heredar estilos */}
            <div className="grupo-componente" style={{ display: 'contents' }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2>Definir Criterios de Evaluación por Trimestre</h2>

                    <div className="bimestre-selector" style={{ justifyContent: 'center', borderBottom: 'none' }}>
                        {[1, 2, 3].map(bim => (
                            <button
                                key={bim}
                                className={`btn ${bimestreActivo === bim ? 'btn-primary' : 'btn-cancel'}`}
                                onClick={() => handleSetBimestre(bim)}
                            >
                                Trimestre {bim}
                            </button>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '1.5rem' }}>
                        {bimestreActivo > 1 && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleCopiarCriterios(bimestreActivo - 1, bimestreActivo)}
                                disabled={criteriosDelBimestre.length > 0 || criteriosLocales[bimestreActivo - 1]?.length === 0}
                                title={criteriosDelBimestre.length > 0 ? "Elimina los criterios actuales para copiar." : `Copia criterios de Bimestre ${bimestreActivo - 1}`}
                            >
                                <span role="img" aria-label="copiar">📋</span> Copiar Criterios de Trimestre {bimestreActivo - 1}
                            </button>
                        )}
                    </div>


                    <h3>Criterios para Trimestre {bimestreActivo}</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {criteriosDelBimestre.map((c, index) => (
                            <div key={index} className="criterio-item">
                                <span>{c.nombre} - <strong>{c.porcentaje}%</strong></span>
                                <button
                                    onClick={() => removeCriterio(index)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        marginLeft: '15px',
                                        lineHeight: 1
                                    }}
                                >
                                    <span role="img" aria-label="eliminar">🗑️</span>
                                </button>
                            </div>
                        ))}
                        {criteriosDelBimestre.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>No hay criterios definidos para este Trimestre.</p>}
                    </div>

                    <div className="criterio-form">
                        <input type="text" placeholder="Nombre (Ej: Tareas)" value={nombre} onChange={e => setNombre(e.target.value)} />
                        <div className="porcentaje-wrapper">
                            <input type="number" placeholder="Porcentaje" min="1" max="100" value={porcentaje} onChange={e => setPorcentaje(e.target.value)} />
                        </div>
                        <button
                            className="btn"
                            onClick={addCriterio}
                            disabled={totalPorcentaje >= 100 || !nombre.trim() || !porcentaje}
                        >
                            Añadir
                        </button>
                    </div>

                    <div className={`criterio-total ${totalPorcentaje !== 100 ? 'error' : ''}`}>
                        <strong>Total del Trimestre {bimestreActivo}: {totalPorcentaje}% / 100%</strong>
                    </div>

                    <div className="modal-actions">
                        <button className="btn btn-cancel" onClick={onClose}>Cancelar</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleGuardar}
                            disabled={criteriosDelBimestre.length > 0 && totalPorcentaje !== 100}
                        >
                            Guardar Todos los Criterios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Trabajos;