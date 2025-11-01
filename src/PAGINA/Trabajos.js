import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';


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

    // Se añade la clase 'exito' y 'error' para coincidir con la lógica interna
    const claseTipo = tipo === 'exito' ? 'exito' : 'error';

    return <div className={`notificacion-flotante ${claseTipo}`}>{mensaje}</div>;
}


// ======================================
// --- 2. Componente Principal: Trabajos ---
// ======================================
function Trabajos({ user }) {
    
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
    const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState(null);

    useEffect(() => {
        const fetchGrupos = async () => {
            const token = localStorage.getItem('token');
            
            // FIX 1: Usar user._id si está disponible, sino user.id. 
            // Se necesita un ID para la verificación posterior.
            const userId = user?._id || user?.id; 

            // Asegurar que el token y el ID del usuario existan
            if (!token || !userId) {
                setLoading(false);
                setError("Error de autenticación: Usuario o token no disponible.");
                return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                // La URL de la API se mantiene igual (carga los grupos asignados a este profesor)
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
    };
    
    const handleVolver = () => {
        setGrupoSeleccionado(null);
        setAsignaturaSeleccionada(null);
    };

    if (loading) return <div className="trabajos-container grupo-componente" style={{textAlign: 'center', paddingTop: '10rem'}}><p style={{color: '#E9E9E9'}}>Cargando tus grupos...</p></div>;
    if (error) return <div className="trabajos-container grupo-componente error-mensaje" style={{textAlign: 'center', paddingTop: '10rem'}}><p>{error}</p></div>;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

                /* ================================================= */
                /* ESTILOS EXCLUSIVOS PARA Trabajos.js               */
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
                    /* CORRECCIÓN: Fondo para toda la página */
                    background-color: var(--dark-color); 
                    min-height: 100vh;
                }

                /* --- ESTRUCTURA GENERAL Y TÍTULOS --- */
                .grupo-componente {
                    font-family: var(--body-font);
                    color: var(--text-color);
                }

                .grupo-componente .trabajos-container { /* Usando 'trabajos-container' */
                    padding-top: 8rem; /* Ajuste para barra de navegación superior (si existe) */
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
                    width: 100%; /* Asegura que ocupe el ancho en el modal de calificaciones */
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
                    background-color: #3C414C; /* Gris oscuro para botones estándar */
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
                .grupo-componente .btn-secondary { /* Estilo para el botón Copiar Criterios */
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
                .grupo-componente .grupos-table-wrapper { /* Envoltorio para centrar la tabla */
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }
                .grupo-componente .grupos-table {
                    width: 90%; /* Ajustado al 90% para centrar bien */
                    max-width: 800px;
                    margin-top: 2rem;
                    border-collapse: separate; /* Cambiado a separate */
                    border-spacing: 0; /* Eliminar espacio entre celdas */
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                    border-radius: 12px;
                    overflow: hidden; /* Asegura que el border-radius funcione */
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
                    padding: 0.6rem 1.2rem; /* Botón más pequeño en la tabla */
                    font-size: 0.9rem;
                }

                /* ================================================= */
                /* ESTILOS PARA EL PANEL DE CALIFICACIÓN TIPO ASISTENCIA */
                /* ================================================= */

                /* CAMBIO CLAVE: Usa un fondo oscuro sólido para simular un modal de pantalla completa elegante */
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

                .grupo-componente .modal-content.asistencia-modal-content {
                    background-color: var(--dark-color-alt); 
                    border-radius: 12px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                    padding: 20px; 
                    width: 95%; 
                    max-width: 1200px;
                    margin: 0; 
                }
                
                /* Corrección de alineación de botones de Bimestre */
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
                    max-height: 65vh; /* Altura máxima para la lista de alumnos */
                    overflow-y: auto;
                    padding-right: 10px;
                }

                .grupo-componente .asistencia-row {
                    /* Columna 1: Nombre (250px), Columna 2: Criterios (espacio restante), Columna 3: Promedio Final (100px) */
                    display: grid; 
                    grid-template-columns: 280px 1fr 120px; 
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
                    gap: 10px; /* Más espacio entre botones de criterio */
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
                    grid-column: 1 / -1; /* Ocupa todo el ancho en la fila de grid */
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
                    grid-template-columns: repeat(auto-fill, minmax(38px, 1fr)); /* Cuadritos un poco más grandes */
                    gap: 8px; /* Más espacio */
                    align-items: center;
                    padding: 10px 0;
                }

                .grupo-componente .cuadrito-calificacion {
                    width: 38px;
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
                    background-color: #34495e; /* Azul secundario formal */
                    color: white;
                    border: none;
                    border-radius: 6px;
                    width: 38px;
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

                /* --- MODAL DE CRITERIOS (CON NUEVOS ESTILOS) --- */
                .grupo-componente .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    display: flex; justify-content: center; align-items: center; z-index: 1050;
                }

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
                
                .grupo-componente .criterio-form {
                    display: flex;
                    gap: 15px;
                    margin: 2rem 0 1rem 0;
                    align-items: center;
                }
                .grupo-componente .criterio-form input {
                    background: var(--dark-color);
                    border: 1px solid #555;
                    border-radius: 8px;
                    color: var(--text-color);
                    padding: 12px;
                    box-sizing: border-box;
                    font-size: 1rem;
                }
                .grupo-componente .criterio-form input:focus {
                    border-color: var(--main-color);
                }
                .grupo-componente .criterio-form input[type="text"] { flex-grow: 3; }

                .grupo-componente .porcentaje-wrapper {
                    position: relative;
                    flex-grow: 1;
                    max-width: 150px;
                }
                .grupo-componente .porcentaje-wrapper::after {
                    content: '%';
                    right: 15px;
                    color: #888;
                }
                .grupo-componente .criterio-form input[type="number"] {
                    padding-right: 35px;
                }

                .grupo-componente .criterio-form .btn {
                    padding: 12px 15px;
                    background-color: var(--main-color);
                    color: var(--dark-color);
                    font-weight: 600;
                    border: 1px solid var(--main-color);
                    line-height: 1; /* Para centrar el texto correctamente */
                }
                .grupo-componente .criterio-form .btn:hover {
                    background-color: #d4b03f;
                }

                .grupo-componente .criterio-total {
                    text-align: right; font-size: 1.2rem; font-weight: bold;
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
                /* Ocultar barra de scroll interna */
                .grupo-componente .asistencia-body::-webkit-scrollbar {
                    display: none;
                }
                .grupo-componente .asistencia-body {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                /* Para Webkit (Chrome, Safari, Edge) para el modal principal */
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
                /* ================================================= */
                /* ESTILOS PARA LA NOTIFICACIÓN FLOTANTE (ALERTA) */
                /* ================================================= */

                .notificacion-flotante {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 2000; 

                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

                    opacity: 0;
                    visibility: hidden;
                    /* El 3.5s es el tiempo total de la animación */
                    animation: fadeInOut 3.5s ease-in-out forwards; 
                }

                .notificacion-flotante.exito {
                    background-color: var(--success-color); 
                    color: var(--dark-color); 
                    border: 1px solid #1a8a49;
                }

                .notificacion-flotante.error {
                    background-color: var(--danger-color);
                    color: var(--title-color); 
                    border: 1px solid #a32222;
                }

                @keyframes fadeInOut {
                    0% { opacity: 0; visibility: hidden; transform: translate(-50%, -20px); }
                    5% { opacity: 1; visibility: visible; transform: translate(-50%, 0); } /* Entra */
                    90% { opacity: 1; visibility: visible; transform: translate(-50%, 0); } /* Permanece */
                    100% { opacity: 0; visibility: hidden; transform: translate(-50%, -20px); } /* Sale */
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
                />
            )}
            </div>
        </>
    );
}


// ======================================
// --- 3. Sub-componente: Panel Principal de Calificaciones (MODIFICADO) ---
// Ahora maneja el estado de los criterios como un objeto por bimestre.
// ======================================
const PanelCalificaciones = ({ grupo, asignatura, onVolver }) => {
    const [bimestreActivo, setBimestreActivo] = useState(1);
    // CAMBIO CLAVE: El estado de criterios ahora es un objeto que contiene los criterios por bimestre
    const [criteriosPorBimestre, setCriteriosPorBimestre] = useState({ 1: [], 2: [], 3: [] });
    const [calificaciones, setCalificaciones] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: null, tipo: '' });
    const [modalCriterios, setModalCriterios] = useState(false);
    const [criterioAbierto, setCriterioAbierto] = useState(null); 
    
    // Estado para controlar cuántas tareas se muestran por criterio (por defecto 10)
    const [numTareas, setNumTareas] = useState({}); 

    // Obtener los criterios del bimestre activo
    const criteriosActivos = criteriosPorBimestre[bimestreActivo] || [];


    useEffect(() => {
        const fetchCalificaciones = async () => {
            setIsLoadingData(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const res = await axios.get(`${API_URL}/calificaciones?grupoId=${grupo._id}&asignatura=${asignatura}`, config);
                
                // CAMBIO CLAVE: Criterios ahora es por bimestre. Inicializa si está vacío.
                const fetchedCriterios = res.data?.criterios || { 1: [], 2: [], 3: [] };
                setCriteriosPorBimestre(fetchedCriterios);

                setCalificaciones(res.data?.calificaciones || {});
                
                // Recopila TODOS los criterios para calcular el maxIndex de tareas
                const allCriterios = [...fetchedCriterios[1], ...fetchedCriterios[2], ...fetchedCriterios[3]];
                
                const initialNumTareas = allCriterios.reduce((acc, criterio) => {
                    let maxIndex = 0;
                    // Buscar la tarea máxima en todos los bimestres para este criterio
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


                if (!res.data || !res.data.criterios || res.data.criterios[1]?.length === 0) {
                    setModalCriterios(true);
                }
            } catch (error) {
                setNotificacion({ mensaje: 'Error al cargar los datos de calificaciones.', tipo: 'error' });
            } finally {
                setIsLoadingData(false);
            }
        };
        if (grupo && asignatura) fetchCalificaciones();
    }, [grupo, asignatura]);

    const guardarCalificaciones = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // CAMBIO CLAVE: Envía criteriosPorBimestre
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

    const handleCalificacionChange = (alumnoId, bimestre, criterioNombre, tareaIndex, valor) => {
        // La lógica se mantiene igual y es robusta
        const notaFloat = valor === '' ? null : parseFloat(valor);
        if (notaFloat !== null && (isNaN(notaFloat) || notaFloat < 0 || notaFloat > 10)) return;
        
        const nuevaEntrada = notaFloat === null ? null : {
            nota: notaFloat,
            fecha: new Date().toISOString()
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
        // Obtiene los criterios del bimestre específico
        const criteriosDelBimestre = criteriosPorBimestre[bimestre] || [];
        
        if (criteriosDelBimestre.length === 0) return 0;
        
        const promedioPonderado = criteriosDelBimestre.reduce((acc, criterio) => {
            const promCriterio = calcularPromedioCriterio(alumnoId, bimestre, criterio.nombre);
            return acc + (promCriterio * (criterio.porcentaje / 100));
        }, 0);
        
        return promedioPonderado.toFixed(2);
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
        // Aumenta el contador de tareas mostradas en 5
        setNumTareas(prev => ({...prev, [criterioNombre]: (prev[criterioNombre] || 10) + 5}));
    };


    if (isLoadingData) return <div className="trabajos-container grupo-componente" style={{textAlign: 'center', paddingTop: '10rem'}}><p style={{color: '#E9E9E9'}}>Cargando datos del grupo...</p></div>;

    return (
        <div className="modal-backdrop-solid grupo-componente"> 
            <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: null, tipo: '' })} />
            <div className="asistencia-modal-content">
                <header className="main-header" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
                    <h2>Calificaciones: {grupo.nombre} - {asignatura}</h2>
                    <div>
                        {/* Pasa el estado de criterios completo al modal */}
                        <button className="btn" onClick={() => setModalCriterios(true)}>Criterios</button>
                        <button className="btn btn-cancel" onClick={onVolver} style={{marginLeft: '10px'}}>Cerrar</button>
                    </div>
                </header>
                <div className="bimestre-selector">
                    {[1, 2, 3].map(bim => (
                        <button key={bim} className={`btn ${bimestreActivo === bim ? 'btn-primary' : ''}`} onClick={() => setBimestreActivo(bim)}>Bimestre {bim}</button>
                    ))}
                </div>
                
                {/* CAMBIO CLAVE: Usamos criteriosActivos */}
                {criteriosActivos.length > 0 ? (
                    <div className="asistencia-grid">
                        <div className="asistencia-body">
                            {grupo.alumnos.sort((a,b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)).map(alumno => (
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
                                        <div className="promedio-final-display" style={{color: calcularPromedioBimestre(alumno._id, bimestreActivo) >= 6 ? '#27ae60' : '#d32f2f'}}>
                                            Prom: {calcularPromedioBimestre(alumno._id, bimestreActivo)}
                                        </div>
                                    </div>
                                    {criterioAbierto?.alumnoId === alumno._id && (
                                        <div className={`bimestre-desplegable desplegado`}>
                                            
                                            {/* FIX: Contenedor para centrar el cuadro de resumen del criterio */}
                                            <div className="criterio-resumen-wrapper">
                                                <div className="criterio-resumen">
                                                    <span className="criterio-info">
                                                        {criterioAbierto.criterioNombre} ({criteriosActivos.find(c => c.nombre === criterioAbierto.criterioNombre)?.porcentaje}%)
                                                    </span>
                                                    <span className="criterio-prom" style={{color: calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre) >= 6 ? 'var(--dark-color)' : 'var(--danger-color)'}}>
                                                        Prom: {calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* FIN FIX */}

                                            <div className="cuadritos-grid">
                                                {/* Usamos numTareas[criterioAbierto.criterioNombre] para determinar cuántos inputs mostrar */}
                                                {Array.from({ length: numTareas[criterioAbierto.criterioNombre] || 10 }).map((_, tareaIndex) => {
                                                    const entrada = calificaciones[alumno._id]?.[bimestreActivo]?.[criterioAbierto.criterioNombre]?.[tareaIndex];
                                                    return <input 
                                                        key={tareaIndex} 
                                                        type="number" 
                                                        min="0" max="10" step="0.1" 
                                                        className="cuadrito-calificacion" 
                                                        placeholder={`${tareaIndex + 1}`} 
                                                        value={entrada?.nota ?? ''} 
                                                        title={formatFechaTooltip(entrada?.fecha)} 
                                                        onChange={(e) => handleCalificacionChange(alumno._id, bimestreActivo, criterioAbierto.criterioNombre, tareaIndex, e.target.value)} 
                                                    />;
                                                })}
                                                <button className="btn btn-agregar-dias" onClick={() => agregarTareas(criterioAbierto.criterioNombre)}>+5</button>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="aviso-criterios"><p>⚠️ Por favor, define los criterios de evaluación para el **Bimestre {bimestreActivo}**.</p></div>
                )}
                <div className="modal-actions" style={{padding: '0 20px'}}>
                    <button className="btn btn-primary" onClick={guardarCalificaciones} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Calificaciones'}</button>
                </div>
            </div>
            {/* CAMBIO CLAVE: Pasa el estado de criterios completo y setCriteriosPorBimestre */}
            {modalCriterios && (
                <ModalCriterios 
                    criteriosPorBimestre={criteriosPorBimestre} 
                    onGuardar={setCriteriosPorBimestre} // Ahora actualiza el objeto completo
                    onClose={() => setModalCriterios(false)} 
                    setNotificacion={setNotificacion} 
                />
            )}
        </div>
    );
};

// ======================================
// --- 4. Componente: Lista de Grupos ---
// ======================================
const ListaDeGrupos = ({ grupos, user, onSeleccionarGrupo }) => {
    // Definimos el ID del usuario actual, priorizando _id (MongoDB)
    const userId = user?._id || user?.id; 
    
    return (
        <>
            <header className="main-header" style={{ justifyContent: 'center', paddingTop: '0' }}><h1>Gestión de Calificaciones</h1></header>
            <h3 className="subtitulo">Selecciona un grupo y asignatura para calificar</h3>
            
            {/* FIX: Contenedor para centrar la tabla y limitar su ancho */}
            <div className="grupos-table-wrapper">
                <table className="grupos-table">
                    <thead><tr><th>Grupo</th><th>Mi Asignatura</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {grupos.map(grupo => {
                            // FIX 2: Usar el ID del usuario actual (userId) para encontrar la asignación.
                            const miAsignacion = grupo.profesoresAsignados.find(asig => asig.profesor?._id === userId); 
                            const miAsignatura = miAsignacion ? miAsignacion.asignatura : 'N/A';
                            
                            return (
                                <tr key={grupo._id}>
                                    <td>{grupo.nombre}</td>
                                    <td>{miAsignatura}</td>
                                    <td className="acciones-cell">
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={() => onSeleccionarGrupo(grupo, miAsignatura)}
                                            // FIX 3: Solo deshabilitar si la asignatura es 'N/A'
                                            disabled={miAsignatura === 'N/A'}
                                        >
                                            Calificar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ======================================
// --- 5. Componente: Modal para Criterios de Evaluación (MODIFICADO) ---
// Implementa criterios individuales por bimestre y función de copiar.
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
        // Validación suave: si hay criterios, el total debe ser 100% para evitar inconsistencias
        if (criteriosDelBimestre.length > 0 && totalPorcentaje !== 100) {
            setNotificacion({ 
                mensaje: `El Bimestre ${bimestreActivo} tiene criterios definidos (${totalPorcentaje}%). Por favor, ajústalo a 100% antes de cambiar.`, 
                tipo: 'error' 
            });
            return;
        }
        setBimestreActivo(bim);
    };

    // Función para añadir un criterio al bimestre activo
    const addCriterio = () => {
        const porciento = parseInt(porcentaje, 10);
        
        // Validación de datos
        if (!nombre.trim() || isNaN(porciento) || porciento <= 0 || totalPorcentaje + porciento > 100) {
            setNotificacion({ 
                mensaje: 'Verifica los datos. El porcentaje debe ser positivo y el total no debe exceder 100%.', 
                tipo: 'error' 
            });
            return;
        }
        
        // No permitir nombres duplicados dentro del mismo bimestre
        if (criteriosDelBimestre.some(c => c.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
             setNotificacion({ 
                mensaje: 'Ya existe un criterio con ese nombre en este bimestre.', 
                tipo: 'error' 
            });
            return;
        }

        const nuevoCriterio = { nombre: nombre.trim(), porcentaje: porciento };

        // Actualizar el estado inmutablemente
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
        // Verificar que TODOS los bimestres que tienen criterios definidos sumen 100%
        for (const [bimestre, criterios] of Object.entries(criteriosLocales)) {
             const totalBimestre = criterios.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
             // Si hay criterios definidos (criterios.length > 0), deben sumar 100.
             if (criterios.length > 0 && totalBimestre !== 100) {
                setNotificacion({ 
                    mensaje: `ERROR: El Bimestre ${bimestre} debe sumar exactamente 100% para guardar. Actualmente suma ${totalBimestre}%.`, 
                    tipo: 'error' 
                });
                return; 
             }
        }
        
        // Si todo está bien, guardar
        onGuardar(criteriosLocales); 
        onClose();
    };
    
    // Función para copiar los criterios de un bimestre anterior (ej. 1 -> 2)
    const handleCopiarCriterios = (bimestreOrigen, bimestreDestino) => {
        const criteriosOrigen = criteriosLocales[bimestreOrigen];
        if (!criteriosOrigen || criteriosOrigen.length === 0) {
            setNotificacion({ mensaje: `No hay criterios definidos en el Bimestre ${bimestreOrigen}.`, tipo: 'error' });
            return;
        }
        
        // Debe sumar 100% el origen para ser copiado.
        const totalOrigen = criteriosOrigen.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
        if (totalOrigen !== 100) {
            setNotificacion({ mensaje: `El Bimestre ${bimestreOrigen} debe sumar 100% antes de ser copiado.`, tipo: 'error' });
            return;
        }

        setCriteriosLocales(prev => ({
            ...prev,
            [bimestreDestino]: criteriosOrigen.map(c => ({...c})) // Copia profunda
        }));
        setBimestreActivo(bimestreDestino);
        setNotificacion({ mensaje: `Criterios del Bimestre ${bimestreOrigen} copiados a Bimestre ${bimestreDestino}.`, tipo: 'exito' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Definir Criterios de Evaluación por Bimestre</h2>
                
                {/* Selector de Bimestre */}
                <div className="bimestre-selector" style={{ justifyContent: 'center', borderBottom: 'none' }}>
                    {[1, 2, 3].map(bim => (
                        <button 
                            key={bim} 
                            className={`btn ${bimestreActivo === bim ? 'btn-primary' : 'btn-cancel'}`} 
                            onClick={() => handleSetBimestre(bim)}
                        >
                            Bimestre {bim}
                        </button>
                    ))}
                </div>
                
                {/* Botón de Copiar Criterios */}
                <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '1.5rem' }}>
                    {bimestreActivo > 1 && (
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => handleCopiarCriterios(bimestreActivo - 1, bimestreActivo)}
                            disabled={criteriosDelBimestre.length > 0 || criteriosLocales[bimestreActivo - 1]?.length === 0}
                            title={criteriosDelBimestre.length > 0 ? "Elimina los criterios actuales para copiar." : `Copia criterios de Bimestre ${bimestreActivo - 1}`}
                        >
                            <span role="img" aria-label="copiar">📋</span> Copiar Criterios de Bimestre {bimestreActivo - 1}
                        </button>
                    )}
                </div>


                <h3>Criterios para Bimestre {bimestreActivo}</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {criteriosDelBimestre.map((c, index) => (
                        <div key={index} className="criterio-item">
                            <span>{c.nombre} - <strong>{c.porcentaje}%</strong></span>
                            {/* Ajuste de estilo para el botón de eliminar */}
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
                    {criteriosDelBimestre.length === 0 && <p style={{textAlign: 'center', color: '#999'}}>No hay criterios definidos para este bimestre.</p>}
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
                    <strong>Total del Bimestre {bimestreActivo}: {totalPorcentaje}% / 100%</strong>
                </div>
                
                <div className="modal-actions">
                    <button className="btn btn-cancel" onClick={onClose}>Cancelar</button>
                    {/* El guardado ya no se basa solo en el bimestre activo, sino en todos. */}
                    <button 
                        className="btn btn-primary" 
                        onClick={handleGuardar} 
                        // Deshabilita si el bimestre activo no suma 100% pero tiene criterios
                        disabled={criteriosDelBimestre.length > 0 && totalPorcentaje !== 100}
                    >
                        Guardar Todos los Criterios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Trabajos;