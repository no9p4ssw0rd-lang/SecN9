import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Se eliminó: import { useContext } from 'react';

// La URL de la API se obtiene de las variables de entorno
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// --- Componente de Notificación (Integrado) ---
function Notificacion({ mensaje, tipo, onClose }) {
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje, onClose]);

  if (!mensaje) return null;

  return <div className={`notificacion-flotante ${tipo}`}>{mensaje}</div>;
}


// --- Componente Principal: Trabajos ---
function Trabajos({ user }) { // Ahora acepta 'user' como prop
  
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState(null);

  useEffect(() => {
    const fetchGrupos = async () => {
      const token = localStorage.getItem('token');
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
    
    // Verificamos si el usuario fue pasado como prop y si existe un token
    if (user && localStorage.getItem('token')) {
        fetchGrupos();
    } else {
        // Si no hay usuario, detenemos la carga y mostramos un error
        setLoading(false);
        setError("Error de autenticación: El usuario no está disponible.");
    }
  }, [user]); // Depende de la prop 'user'

  const handleSeleccionarGrupo = (grupo, asignatura) => {
    setGrupoSeleccionado(grupo);
    setAsignaturaSeleccionada(asignatura);
  };
  
  const handleVolver = () => {
    setGrupoSeleccionado(null);
    setAsignaturaSeleccionada(null);
  };

  if (loading) return <div className="trabajos-container"><p>Cargando tus grupos...</p></div>;
  if (error) return <div className="trabajos-container error-mensaje"><p>{error}</p></div>;

  return (
    <>
      <style>{`
        /* Estilos generales del componente */
        .trabajos-container { padding: 2rem; max-width: 1200px; margin: auto; }
        .error-mensaje { color: #dc3545; text-align: center; }
        .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
        .subtitulo { text-align: center; color: #666; margin-bottom: 2rem; }
        .btn { padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: background-color 0.3s; }
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

        /* Estilos del panel de calificaciones */
        .modal-backdrop-solid { background-color: #f4f7f6; min-height: 100vh; padding: 2rem; }
        .asistencia-modal-content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .bimestre-selector { display: flex; gap: 10px; margin-bottom: 20px; }
        .asistencia-grid { margin-top: 20px; }
        .asistencia-row { display: grid; grid-template-columns: 2fr 3fr 1fr; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
        .alumno-nombre { font-weight: bold; }
        .bimestres-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .bimestre-header-btn { background-color: #e9ecef; border: 1px solid #ced4da; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
        .bimestre-header-btn.activo { background-color: #007bff; color: white; border-color: #007bff; }
        .promedio-final-display { font-weight: bold; font-size: 1.1em; text-align: right; }
        .bimestre-desplegable { background: #fafafa; padding: 15px; display: none; }
        .bimestre-desplegable.desplegado { display: block; }
        .cuadritos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 10px; margin-top: 10px; }
        .cuadrito-calificacion { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; text-align: center; }
        
        /* Modal Criterios */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1050; }
        .modal-content { background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px; }
        .criterio-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
        .criterio-form { display: flex; gap: 10px; margin: 15px 0; }
        .criterio-total { margin-top: 10px; font-weight: bold; }
        .criterio-total.error { color: #dc3545; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        
        /* Notificación */
        .notificacion-flotante { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 5px; color: white; z-index: 2000; }
        .notificacion-flotante.exito { background-color: #28a745; }
        .notificacion-flotante.error { background-color: #dc3545; }
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


// --- Sub-componente: Panel Principal de Calificaciones ---
const PanelCalificaciones = ({ grupo, asignatura, onVolver }) => {
    const [bimestreActivo, setBimestreActivo] = useState(1);
    const [criterios, setCriterios] = useState([]);
    const [calificaciones, setCalificaciones] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: null, tipo: '' });
    const [modalCriterios, setModalCriterios] = useState(false);
    const [criterioAbierto, setCriterioAbierto] = useState(null); 
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
        const notaFloat = valor === '' ? null : parseFloat(valor);
        if (notaFloat !== null && (isNaN(notaFloat) || notaFloat < 0 || notaFloat > 10)) return;
        
        setCalificaciones(prev => {
            const newCalificaciones = { ...prev };
            if (!newCalificaciones[alumnoId]) newCalificaciones[alumnoId] = {};
            if (!newCalificaciones[alumnoId][bimestre]) newCalificaciones[alumnoId][bimestre] = {};
            if (!newCalificaciones[alumnoId][bimestre][criterioNombre]) newCalificaciones[alumnoId][bimestre][criterioNombre] = {};
            
            if (notaFloat === null) {
                delete newCalificaciones[alumnoId][bimestre][criterioNombre][tareaIndex];
            } else {
                newCalificaciones[alumnoId][bimestre][criterioNombre][tareaIndex] = { nota: notaFloat, fecha: new Date().toISOString() };
            }
            return newCalificaciones;
        });
    };

    const calcularPromedioCriterio = (alumnoId, bimestre, criterioNombre) => {
        const tareas = calificaciones[alumnoId]?.[bimestre]?.[criterioNombre] || {};
        const notasValidas = Object.values(tareas).filter(e => e && typeof e.nota === 'number').map(e => e.nota);
        if (notasValidas.length === 0) return 0;
        return notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length;
    };

    const calcularPromedioBimestre = (alumnoId, bimestre) => {
        if (criterios.length === 0) return 0;
        const promedioPonderado = criterios.reduce((acc, criterio) => {
            const promCriterio = calcularPromedioCriterio(alumnoId, bimestre, criterio.nombre);
            return acc + (promCriterio * (criterio.porcentaje / 100));
        }, 0);
        return promedioPonderado.toFixed(2);
    };
    
    // ... El resto de las funciones auxiliares (formatFechaTooltip, handleToggleCriterio, etc.)
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

    if (isLoadingData) return <div className="trabajos-container"><p>Cargando datos del grupo...</p></div>;

    return (
        <div className="modal-backdrop-solid"> 
            <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: null, tipo: '' })} />
            <div className="asistencia-modal-content">
                <header className="main-header">
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
                                                <div key={criterio.nombre} className={`bimestre-header-btn ${criterioAbierto?.alumnoId === alumno._id && criterioAbierto?.criterioNombre === criterio.nombre ? 'activo' : ''}`} onClick={() => handleToggleCriterio(alumno._id, criterio.nombre)}>
                                                    {criterio.nombre} ({criterio.porcentaje}%)
                                                </div>
                                            ))}
                                        </div>
                                        <div className="promedio-final-display" style={{color: calcularPromedioBimestre(alumno._id, bimestreActivo) >= 6 ? '#28a745' : '#dc3545'}}>
                                            Prom: {calcularPromedioBimestre(alumno._id, bimestreActivo)}
                                        </div>
                                    </div>
                                    {criterioAbierto?.alumnoId === alumno._id && (
                                        <div className="bimestre-desplegable desplegado">
                                            <div className="cuadritos-grid">
                                                {Array.from({ length: numTareas[criterioAbierto.criterioNombre] || 10 }).map((_, tareaIndex) => {
                                                    const entrada = calificaciones[alumno._id]?.[bimestreActivo]?.[criterioAbierto.criterioNombre]?.[tareaIndex];
                                                    return <input key={tareaIndex} type="number" min="0" max="10" step="0.1" className="cuadrito-calificacion" placeholder={`${tareaIndex + 1}`} value={entrada?.nota ?? ''} title={formatFechaTooltip(entrada?.fecha)} onChange={(e) => handleCalificacionChange(alumno._id, bimestreActivo, criterioAbierto.criterioNombre, tareaIndex, e.target.value)} />;
                                                })}
                                                <button className="btn" onClick={() => agregarTareas(criterioAbierto.criterioNombre)}>+5</button>
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
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={guardarCalificaciones} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Calificaciones'}</button>
                </div>
            </div>
            {modalCriterios && <ModalCriterios criteriosExistentes={criterios} onGuardar={setCriterios} onClose={() => setModalCriterios(false)} setNotificacion={setNotificacion} />}
        </div>
    );
};

// --- Componente: Lista de Grupos ---
const ListaDeGrupos = ({ grupos, user, onSeleccionarGrupo }) => (
    <>
        <header className="main-header"><h1>Gestión de Calificaciones</h1></header>
        <h3 className="subtitulo">Selecciona un grupo y asignatura para calificar</h3>
        <table className="grupos-table">
            <thead><tr><th>Grupo</th><th>Mi Asignatura</th><th>Acciones</th></tr></thead>
            <tbody>
                {grupos.map(grupo => {
                    // Utilizamos el user prop, que debe tener la propiedad '_id' o 'id' para coincidir con la API
                    const miAsignacion = grupo.profesoresAsignados.find(asig => asig.profesor?._id === user.id); 
                    return miAsignacion ? (
                        <tr key={`${grupo._id}-${miAsignacion.asignatura}`}>
                            <td>{grupo.nombre}</td>
                            <td>{miAsignacion.asignatura}</td>
                            <td><button className="btn btn-primary" onClick={() => onSeleccionarGrupo(grupo, miAsignacion.asignatura)}>Calificar</button></td>
                        </tr>
                    ) : null;
                })}
            </tbody>
        </table>
    </>
);

// --- Componente: Modal para Criterios de Evaluación ---
const ModalCriterios = ({ criteriosExistentes, onGuardar, onClose, setNotificacion }) => {
    const [criterios, setCriterios] = useState(criteriosExistentes || []);
    const [nombre, setNombre] = useState('');
    const [porcentaje, setPorcentaje] = useState('');
    const totalPorcentaje = criterios.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

    const addCriterio = () => {
        const porciento = parseInt(porcentaje, 10);
        if (nombre.trim() && !isNaN(porciento) && porciento > 0 && totalPorcentaje + porciento <= 100) {
            setCriterios([...criterios, { nombre, porcentaje: porciento }]);
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Definir Criterios de Evaluación</h2>
                {criterios.map((c, index) => (
                    <div key={index} className="criterio-item">
                        <span>{c.nombre} - <strong>{c.porcentaje}%</strong></span>
                        <button onClick={() => removeCriterio(index)}>×</button>
                    </div>
                ))}
                <div className="criterio-form">
                    <input type="text" placeholder="Nombre (Ej: Tareas)" value={nombre} onChange={e => setNombre(e.target.value)} />
                    <input type="number" placeholder="Porcentaje (Ej: 40)" value={porcentaje} onChange={e => setPorcentaje(e.target.value)} />
                    <button className="btn" onClick={addCriterio}>Añadir</button>
                </div>
                <div className={`criterio-total ${totalPorcentaje > 100 ? 'error' : ''}`}>
                    <strong>Total: {totalPorcentaje}% / 100%</strong>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleGuardar}>Guardar Criterios</button>
                </div>
            </div>
        </div>
    );
};

export default Trabajos;
