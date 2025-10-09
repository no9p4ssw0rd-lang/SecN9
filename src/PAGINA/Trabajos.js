import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import "./Trabajos.css";
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
      // Asegurar que el token y el user existan
      if (!token || !user || !user.id) {
        setLoading(false);
        setError("Error de autenticación: Usuario o token no disponible.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        // La URL de la API se mantiene igual
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

  if (loading) return <div className="trabajos-container" style={{textAlign: 'center', paddingTop: '10rem'}}><p>Cargando tus grupos...</p></div>;
  if (error) return <div className="trabajos-container error-mensaje" style={{textAlign: 'center', paddingTop: '10rem'}}><p>{error}</p></div>;

  return (
    <>
      <style>{`
        /* Estilos generales del componente */
        .trabajos-container { padding: 2rem; max-width: 1200px; margin: auto; }
        .error-mensaje { color: #dc3545; text-align: center; }
        .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
        .subtitulo { text-align: center; color: #666; margin-bottom: 2rem; }
        .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: background-color 0.3s; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-primary:hover { background-color: #0056b3; }
        .btn-cancel { background-color: #6c757d; color: white; }
        .btn-cancel:hover { background-color: #5a6268; }
        .btn:disabled { background-color: #ccc; cursor: not-allowed; }

        /* Estilos de la tabla de grupos */
        .grupos-table { width: 100%; border-collapse: collapse; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .grupos-table th, .grupos-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .grupos-table th { background-color: #f8f9fa; }
        .grupos-table tbody tr:hover { background-color: #f1f1f1; }
        .acciones-cell button { margin: 0; }

        /* Estilos del panel de calificaciones */
        .modal-backdrop-solid { background-color: #f4f7f6; min-height: 100vh; padding: 2rem; }
        .asistencia-modal-content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .bimestre-selector { display: flex; gap: 10px; margin-bottom: 20px; padding: 0 20px; justify-content: flex-start;}
        .asistencia-grid { margin-top: 20px; padding: 0 20px; }
        .asistencia-row { display: grid; grid-template-columns: 2fr 3fr 1fr; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
        .alumno-nombre { font-weight: bold; }
        .bimestres-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .bimestre-header-btn { background-color: #e9ecef; border: 1px solid #ced4da; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9em; white-space: nowrap;}
        .bimestre-header-btn.activo { background-color: #007bff; color: white; border-color: #007bff; }
        .promedio-final-display { font-weight: bold; font-size: 1.1em; text-align: right; }
        .bimestre-desplegable { background: #fafafa; padding: 15px; display: none; margin: 0 -20px; } /* Ajuste de margen para cubrir el ancho */
        .bimestre-desplegable.desplegado { display: block; }
        .cuadritos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 10px; margin-top: 10px; }
        .cuadrito-calificacion { 
          width: 100%; 
          padding: 8px 4px; 
          border: 1px solid #ccc; 
          border-radius: 4px; 
          text-align: center; 
          font-size: 0.9em;
        }
        
        /* Modal Criterios */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1050; }
        .modal-content { background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px; }
        .criterio-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
        .criterio-item button { color: #dc3545; background: none; font-size: 1.2em; }
        .criterio-form { display: flex; gap: 10px; margin: 15px 0; }
        .criterio-form input { flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        .criterio-total { margin-top: 10px; font-weight: bold; }
        .criterio-total.error { color: #dc3545; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        
        /* Notificación */
        .notificacion-flotante { 
          position: fixed; top: 80px; right: 20px; 
          padding: 12px 20px; border-radius: 5px; 
          color: white; z-index: 2000; 
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .notificacion-flotante.exito { background-color: #28a745; }
        .notificacion-flotante.error { background-color: #dc3545; }

        @media (max-width: 768px) {
            .asistencia-row { grid-template-columns: 1fr; gap: 10px; }
            .promedio-final-display { text-align: left; }
            .asistencia-grid { padding: 0 10px; }
            .bimestre-selector { padding: 0 10px; flex-wrap: wrap; }
            .bimestre-selector button { flex-grow: 1; }
            .asistencia-modal-content { padding: 10px; }
            .bimestre-desplegable { margin: 0 -10px; }
        }
      `}</style>
      <div className="trabajos-container">
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
// --- 3. Sub-componente: Panel Principal de Calificaciones ---
// La lógica aquí se unifica, adoptando la gestión de tareas más robusta del código viejo.
// ======================================
const PanelCalificaciones = ({ grupo, asignatura, onVolver }) => {
    const [bimestreActivo, setBimestreActivo] = useState(1);
    const [criterios, setCriterios] = useState([]);
    const [calificaciones, setCalificaciones] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: null, tipo: '' });
    const [modalCriterios, setModalCriterios] = useState(false);
    const [criterioAbierto, setCriterioAbierto] = useState(null); 
    
    // Estado para controlar cuántas tareas se muestran por criterio (por defecto 10)
    const [numTareas, setNumTareas] = useState({}); 

    useEffect(() => {
        const fetchCalificaciones = async () => {
            setIsLoadingData(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const res = await axios.get(`${API_URL}/calificaciones?grupoId=${grupo._id}&asignatura=${asignatura}`, config);
                
                setCriterios(res.data?.criterios || []);
                setCalificaciones(res.data?.calificaciones || {});
                
                // Inicializa numTareas basado en los datos existentes o a 10
                const initialNumTareas = (res.data?.criterios || []).reduce((acc, criterio) => {
                    // Intenta encontrar la tarea con el índice más alto + 1, o usa 10 por defecto.
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


                if (!res.data || !res.data.criterios || res.data.criterios.length === 0) {
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
        const payload = { grupoId: grupo._id, asignatura, criterios, calificaciones };
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
        if (criterios.length === 0) return 0;
        
        const promedioPonderado = criterios.reduce((acc, criterio) => {
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


    if (isLoadingData) return <div className="trabajos-container" style={{textAlign: 'center', paddingTop: '10rem'}}><p>Cargando datos del grupo...</p></div>;

    return (
        <div className="modal-backdrop-solid"> 
            <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: null, tipo: '' })} />
            <div className="asistencia-modal-content">
                <header className="main-header" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
                    <h2>Calificaciones: {grupo.nombre} - {asignatura}</h2>
                    <div>
                        <button className="btn" onClick={() => setModalCriterios(true)}>Criterios</button>
                        <button className="btn btn-cancel" onClick={onVolver} style={{marginLeft: '10px'}}>Cerrar</button>
                    </div>
                </header>
                <div className="bimestre-selector">
                    {[1, 2, 3].map(bim => (
                        <button key={bim} className={`btn ${bimestreActivo === bim ? 'btn-primary' : ''}`} onClick={() => setBimestreActivo(bim)}>Bimestre {bim}</button>
                    ))}
                </div>
                
                {criterios.length > 0 ? (
                    <div className="asistencia-grid">
                        <div className="asistencia-body">
                            {grupo.alumnos.sort((a,b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)).map(alumno => (
                                <React.Fragment key={alumno._id}>
                                    <div className="asistencia-row">
                                        <div className="alumno-nombre">{`${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''} ${alumno.nombre}`}</div>
                                        <div className="bimestres-container">
                                            {criterios.map(criterio => (
                                                <div 
                                                    key={criterio.nombre} 
                                                    className={`bimestre-header-btn ${criterioAbierto?.alumnoId === alumno._id && criterioAbierto?.criterioNombre === criterio.nombre ? 'activo' : ''}`} 
                                                    onClick={() => handleToggleCriterio(alumno._id, criterio.nombre)}
                                                >
                                                    {criterio.nombre} ({criterio.porcentaje}%)
                                                </div>
                                            ))}
                                        </div>
                                        <div className="promedio-final-display" style={{color: calcularPromedioBimestre(alumno._id, bimestreActivo) >= 6 ? '#28a745' : '#dc3545'}}>
                                            Prom: {calcularPromedioBimestre(alumno._id, bimestreActivo)}
                                        </div>
                                    </div>
                                    {criterioAbierto?.alumnoId === alumno._id && (
                                        <div className={`bimestre-desplegable desplegado`}>
                                            {/* Opcional: Mostrar promedio del criterio en el desplegable */}
                                            <div style={{marginBottom: '10px', fontWeight: 'bold'}}>
                                                Promedio "{criterioAbierto.criterioNombre}": 
                                                <span style={{color: calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre) >= 6 ? '#28a745' : '#dc3545', marginLeft: '5px'}}>
                                                    {calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre).toFixed(2)}
                                                </span>
                                            </div>
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
                                                <button className="btn" onClick={() => agregarTareas(criterioAbierto.criterioNombre)} style={{backgroundColor: '#17a2b8', color: 'white'}}>+5 Tareas</button>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{padding: '2rem', textAlign: 'center'}}><p>⚠️ Por favor, define los criterios de evaluación para comenzar a calificar.</p></div>
                )}
                <div className="modal-actions" style={{padding: '0 20px'}}>
                    <button className="btn btn-primary" onClick={guardarCalificaciones} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Calificaciones'}</button>
                </div>
            </div>
            {modalCriterios && <ModalCriterios criteriosExistentes={criterios} onGuardar={setCriterios} onClose={() => setModalCriterios(false)} setNotificacion={setNotificacion} />}
        </div>
    );
};

// ======================================
// --- 4. Componente: Lista de Grupos ---
// ======================================
const ListaDeGrupos = ({ grupos, user, onSeleccionarGrupo }) => (
    <>
        <header className="main-header" style={{ justifyContent: 'center' }}><h1>Gestión de Calificaciones</h1></header>
        <h3 className="subtitulo">Selecciona un grupo y asignatura para calificar</h3>
        <table className="grupos-table">
            <thead><tr><th>Grupo</th><th>Mi Asignatura</th><th>Acciones</th></tr></thead>
            <tbody>
                {grupos.map(grupo => {
                    // Usar user.id o user._id según la estructura de autenticación de tu app. Se asume user.id o user._id
                    const miAsignacion = grupo.profesoresAsignados.find(asig => asig.profesor?._id === user._id || asig.profesor?.id === user.id); 
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
    </>
);

// ======================================
// --- 5. Componente: Modal para Criterios de Evaluación ---
// ======================================
const ModalCriterios = ({ criteriosExistentes, onGuardar, onClose, setNotificacion }) => {
    const [criterios, setCriterios] = useState(criteriosExistentes || []);
    const [nombre, setNombre] = useState('');
    const [porcentaje, setPorcentaje] = useState('');
    const totalPorcentaje = criterios.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

    const addCriterio = () => {
        const porciento = parseInt(porcentaje, 10);
        if (nombre.trim() && !isNaN(porciento) && porciento > 0 && totalPorcentaje + porciento <= 100) {
            setCriterios([...criterios, { nombre: nombre.trim(), porcentaje: porciento }]);
            setNombre(''); setPorcentaje('');
        } else { 
            setNotificacion({ mensaje: 'Verifica los datos. El total no debe exceder 100%.', tipo: 'error' });
        }
    };

    const removeCriterio = (index) => setCriterios(criterios.filter((_, i) => i !== index));

    const handleGuardar = () => {
        if (totalPorcentaje !== 100) { 
            setNotificacion({ mensaje: 'La suma de porcentajes debe ser exactamente 100%.', tipo: 'error' });
            return; 
        }
        onGuardar(criterios); 
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Definir Criterios de Evaluación</h2>
                {criterios.map((c, index) => (
                    <div key={index} className="criterio-item">
                        <span>{c.nombre} - <strong>{c.porcentaje}%</strong></span>
                        <button onClick={() => removeCriterio(index)}>X</button>
                    </div>
                ))}
                <div className="criterio-form">
                    <input type="text" placeholder="Nombre (Ej: Tareas)" value={nombre} onChange={e => setNombre(e.target.value)} />
                    <input type="number" placeholder="Porcentaje (Ej: 40)" min="1" max="100" value={porcentaje} onChange={e => setPorcentaje(e.target.value)} />
                    <button className="btn" onClick={addCriterio} disabled={totalPorcentaje >= 100 || !nombre.trim() || !porcentaje}>Añadir</button>
                </div>
                <div className={`criterio-total ${totalPorcentaje !== 100 ? 'error' : ''}`}>
                    <strong>Total: {totalPorcentaje}% / 100%</strong>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleGuardar} disabled={totalPorcentaje !== 100}>Guardar Criterios</button>
                </div>
            </div>
        </div>
    );
};

export default Trabajos;
