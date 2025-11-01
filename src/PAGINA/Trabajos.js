import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';


// La URL de la API se obtiene de las variables de entorno para Vercel/Render
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ======================================
// 🚀 1. Componente de Notificación (Integrado)
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
// 🏢 2. Componente Principal: Trabajos
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
                    grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
                    gap: 8px;
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
                .grupo-componente .modal-content {
                    background-color: #1a1a2e; /* Fondo oscuro más profundo */
                    padding: 2.5rem; border-radius: 12px; width: 90%;
                    max-width: 600px; /* Reducción de ancho para mayor enfoque */
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                    border: 1px solid #333; /* Borde sutil */
                }
                .grupo-componente .modal-content h2 {
                    color: var(--title-color); /* Blanco, formal */
                    font-size: 1.8rem;
                    margin-bottom: 2rem;
                }
                .grupo-componente .modal-content h3 {
                    font-size: 1.4rem;
                    margin-top: 1rem;
                    color: var(--main-color); /* Dorado para destacar */
                }

                /* Selector de Bimestre dentro del Modal (Pestañas) */
                .grupo-componente .modal-content .bimestre-selector {
                    border-bottom: none;
                    margin-bottom: 1.5rem;
                }
                .grupo-componente .modal-content .bimestre-selector .btn {
                    padding: 8px 15px;
                    border-radius: 6px 6px 0 0; /* Pestañas */
                    background-color: #3C414C;
                    border: 1px solid #333;
                    border-bottom: none;
                    color: var(--text-color);
                }
                .grupo-componente .modal-content .bimestre-selector .btn-primary { 
                    background-color: var(--main-color); 
                    color: var(--dark-color);
                    border-color: var(--main-color);
                }

                /* Estilos de los criterios individuales */
                .grupo-componente .criterio-item {
                    background-color: #2c3e50; /* Un color un poco más claro para distinguir */
                    border-left: 5px solid var(--main-color);
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                .grupo-componente .criterio-item:hover {
                    background-color: #34495e;
                }

                /* Estilos del formulario de adición */
                .grupo-componente .criterio-form input {
                    background: var(--dark-color-alt);
                    border-color: #555;
                    transition: border-color 0.3s;
                }
                .grupo-componente .criterio-form input:focus {
                    border-color: var(--main-color);
                    outline: none;
                }
                
                /* Total Porcentaje */
                .grupo-componente .criterio-total {
                    padding: 1.5rem 0; 
                    font-size: 1.3rem; 
                    border-top: 1px solid #444;
                }
                .grupo-componente .criterio-total.error strong {
                    color: var(--danger-color); /* Rojo si no es 100% */
                }
                .grupo-componente .criterio-total:not(.error) strong {
                    color: var(--success-color); /* Verde si es 100% */
                }

                /* Botón de Copiar Criterios */
                .grupo-componente .btn-secondary {
                    background-color: #2c3e50;
                    color: white;
                    border: 1px solid #4a6c90;
                }
                .grupo-componente .btn-secondary:hover:not(:disabled) {
                    background-color: #34495e;
                    transform: translateY(-1px);
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
                    5% { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
                    90% { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
                    100% { opacity: 0; visibility: hidden; transform: translate(-50%, -20px); }
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
// 4. Componente: Lista de Grupos (SIN CAMBIOS)
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
                        {grupos.map(grupo => {
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
// 5. Componente: Modal para Criterios de Evaluación
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
        const criteriosBimAnterior = criteriosLocales[bimestreActivo] || [];
        const totalBimAnterior = criteriosBimAnterior.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

        // Validación de si el bimestre actual (el que se abandona) no está completo
        if (criteriosBimAnterior.length > 0 && totalBimAnterior !== 100) {
            setNotificacion({
                mensaje: `El Bimestre ${bimestreActivo} tiene criterios definidos (${totalBimAnterior}%). Por favor, ajústalo a 100% antes de cambiar.`,
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
                mensaje: 'Ya existe un criterio con ese nombre en este bimestre.',
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
        // Verificar que todos los bimestres con criterios sumen 100%
        for (const [bimestre, criterios] of Object.entries(criteriosLocales)) {
             const totalBimestre = criterios.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
             if (criterios.length > 0 && totalBimestre !== 100) {
                 setNotificacion({
                    mensaje: `ERROR: El Bimestre ${bimestre} debe sumar exactamente 100% para guardar. Actualmente suma ${totalBimestre}%.`,
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
            setNotificacion({ mensaje: `No hay criterios definidos en el **Bimestre ${bimestreOrigen}** para copiar.`, tipo: 'error' });
            return;
        }

        const totalOrigen = criteriosOrigen.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
        if (totalOrigen !== 100) {
            setNotificacion({ mensaje: `El **Bimestre ${bimestreOrigen}** debe sumar **100%** antes de ser copiado. Actualmente: ${totalOrigen}%.`, tipo: 'error' });
            return;
        }

        // Copia los criterios del origen al destino
        setCriteriosLocales(prev => ({
            ...prev,
            [bimestreDestino]: criteriosOrigen.map(c => ({...c}))
        }));
        setBimestreActivo(bimestreDestino); // Cambia automáticamente al bimestre destino
        setNotificacion({ mensaje: `Criterios del Bimestre ${bimestreOrigen} copiados a Bimestre ${bimestreDestino} con éxito.`, tipo: 'exito' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Definir Criterios de Evaluación por Bimestre</h2>

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

                {/* Botón de Copiar Criterios (Diseño más formal) */}
                <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '1.5rem' }}>
                    {bimestreActivo > 1 && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleCopiarCriterios(bimestreActivo - 1, bimestreActivo)}
                            disabled={criteriosDelBimestre.length > 0 || criteriosLocales[bimestreActivo - 1]?.length === 0}
                            title={criteriosDelBimestre.length > 0 ? "Elimina los criterios actuales para copiar." : (criteriosLocales[bimestreActivo - 1]?.length === 0 ? `Bimestre ${bimestreActivo - 1} no tiene criterios.` : `Copia criterios de Bimestre ${bimestreActivo - 1}`)}
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

                {/* Formulario de adición de criterio */}
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

                {/* Total del Bimestre */}
                <div className={`criterio-total ${totalPorcentaje !== 100 ? 'error' : ''}`}>
                    <strong>Total del Bimestre {bimestreActivo}: {totalPorcentaje}% / 100%</strong>
                </div>

                {/* Acciones */}
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
    );
};

export default Trabajos;