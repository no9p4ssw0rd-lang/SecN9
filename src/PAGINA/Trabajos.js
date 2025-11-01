import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';


// La URL de la API se obtiene de las variables de entorno para Vercel/Render
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ======================================
// 🚀 1. Componente de Notificación
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
                /* ... Estilos de Tabla, Botones, etc. (No Modificados) ... */
                
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


                /* --- MODAL DE CRITERIOS (ESTILOS MODIFICADOS PARA APARIENCIA FORMAL) --- */
                
                .grupo-componente .modal-content {
                    background-color: #1a1a2e; /* Fondo oscuro más profundo */
                    padding: 2.5rem; border-radius: 12px; width: 90%;
                    max-width: 600px; /* Reducción de ancho para mayor enfoque */
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                    border: 1px solid #333; /* Borde sutil */
                }
                .grupo-componente .modal-content h2 {
                    color: var(--main-color);
                    font-size: 1.8rem;
                    margin-bottom: 2rem;
                }
                .grupo-componente .modal-content h3 {
                    font-size: 1.4rem;
                    margin-top: 1rem;
                    color: var(--text-color);
                }

                /* Selector de Bimestre dentro del Modal */
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


                /* ESTILOS INNECESARIOS ELIMINADOS/SIMPLIFICADOS */
                
                /* Estilos no relacionados al modal de criterios omitidos para brevedad */
                /* ... otros estilos del archivo original ... */


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
// 📊 3. Sub-componente: Panel Principal de Calificaciones 
// ======================================
const PanelCalificaciones = ({ 
    grupo, 
    asignatura, 
    onVolver, 
    setModalCriterios, 
    criteriosPorBimestre, 
    setCriteriosPorBimestre,
    setNotificacion 
}) => {
    const [bimestreActivo, setBimestreActivo] = useState(1);
    const [calificaciones, setCalificaciones] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [criterioAbierto, setCriterioAbierto] = useState(null); 
    const [numTareas, setNumTareas] = useState({}); 

    // Obtener los criterios del bimestre activo
    const criteriosActivos = criteriosPorBimestre[bimestreActivo] || [];


    useEffect(() => {
        const fetchCalificaciones = async () => {
            setIsLoadingData(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
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
                
                // Lógica de numTareas (se mantiene igual)
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
        if (grupo && asignatura) fetchCalificaciones();
    // Dependencias ajustadas
    }, [grupo, asignatura, setCriteriosPorBimestre, setModalCriterios, setNotificacion]); 

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

    const handleCalificacionChange = (alumnoId, bimestre, criterioNombre, tareaIndex, valor) => {
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
        setNumTareas(prev => ({...prev, [criterioNombre]: (prev[criterioNombre] || 10) + 5}));
    };


    if (isLoadingData) return <div className="trabajos-container grupo-componente" style={{textAlign: 'center', paddingTop: '10rem'}}><p style={{color: '#E9E9E9'}}>Cargando datos del grupo...</p></div>;


    return (
        <div className="modal-backdrop-solid grupo-componente"> 
            {/* Se eliminó la Notificación de aquí */}
            <div className="asistencia-modal-content">
                <header className="main-header" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
                    <h2>Calificaciones: {grupo.nombre} - {asignatura}</h2>
                    <div>
                        {/* Pasa la función del padre para abrir el modal de criterios */}
                        <button className="btn" onClick={() => setModalCriterios(true)}>Criterios</button>
                        <button className="btn btn-cancel" onClick={onVolver} style={{marginLeft: '10px'}}>Cerrar</button>
                    </div>
                </header>
                <div className="bimestre-selector">
                    {[1, 2, 3].map(bim => (
                        <button key={bim} className={`btn ${bimestreActivo === bim ? 'btn-primary' : ''}`} onClick={() => setBimestreActivo(bim)}>Bimestre {bim}</button>
                    ))}
                </div>
                
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

                                            <div className="cuadritos-grid">
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
        </div>
    );
};

// ======================================
// 📑 4. Componente: Lista de Grupos 
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
// ⚙️ 5. Componente: Modal para Criterios de Evaluación (CON LÓGICA DE COPIA Y DISEÑO FORMAL)
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