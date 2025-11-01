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
      
      // Usar user._id si está disponible, sino user.id. 
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
        /* ================================================= */
        /* ESTILOS EXCLUSIVOS PARA Trabajos.js               */
        /* ================================================= */

        /* --- FUENTES Y VARIABLES GLOBALES --- */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .grupo-componente {
          --dark-color: #191D28;
          --dark-color-alt: #1E222D;
          --main-color: #b9972b; /* Dorado */
          --title-color: #FFFFFF;
          --text-color: #E9E9E9;
          --danger-color: #d32f2f;
          --success-color: #27ae60;
          --warning-color: #f39c12;

          --body-font: 'Poppins', sans-serif;
          --font-semi-bold: 600;
          
          /* Estilos de fondo para todo el componente */
          background-color: var(--dark-color); 
          min-height: 100vh;
          color: var(--text-color);
        }

        /* --- ESTRUCTURA GENERAL Y TÍTULOS --- */
        .grupo-componente {
          font-family: var(--body-font);
          color: var(--text-color);
        }

        .grupo-componente .trabajos-container {
            padding-top: 5rem; /* Ajuste para el padding superior */
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
          padding-top: 6rem; /* Aumentado para compensar el fixed header */
        }
        
        .grupo-componente .subtitulo {
          text-align: center;
          margin-bottom: 2rem;
          font-size: 1.5rem;
          color: var(--main-color);
        }
        
        /* --- BOTONES --- */
        .grupo-componente .btn {
          display: inline-block;
          padding: 0.8rem 1.5rem;
          border-radius: .5rem;
          font-weight: 500;
          transition: .3s;
          cursor: pointer;
          color: var(--text-color);
          background-color: var(--dark-color);
          border: 1px solid #555;
        }
        .grupo-componente .btn:hover {
          filter: brightness(1.2);
          transform: translateY(-2px);
          border-color: var(--main-color);
        }
        .grupo-componente .btn-primary { 
          background-color: var(--main-color); 
          color: var(--dark-color);
          border-color: var(--main-color);
        }
        .grupo-componente .btn-cancel { 
          background-color: #2c3e50;
          color: white;
          border-color: #2c3e50;
        }
        .grupo-componente .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        /* --- TABLA DE SELECCIÓN DE GRUPO --- */
        .grupos-table-wrapper {
            display: flex;
            justify-content: center;
            width: 100%;
            margin-top: 2rem;
            margin-bottom: 2rem;
        }

        .grupo-componente .grupos-table {
          width: 90%; 
          max-width: 800px; 
          border-collapse: collapse;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          overflow: hidden;
        }
        .grupo-componente .grupos-table thead th {
          background-color: var(--main-color);
          color: var(--dark-color);
          padding: 15px 20px;
          text-align: left;
        }
        .grupo-componente .grupos-table tbody td {
          padding: 15px 20px;
          border-bottom: 1px solid var(--dark-color-alt);
        }
        .grupo-componente .grupos-table tbody tr:last-of-type {
          border-bottom: 2px solid var(--main-color);
        }
        .grupo-componente .grupos-table tbody tr {
          background-color: #2a2f3c;
          transition: background-color 0.3s;
        }
        .grupo-componente .grupos-table tbody tr:hover {
          background-color: #3c4252;
        }
        .grupo-componente .grupos-table .acciones-cell {
          display: flex;
          gap: 10px;
        }

        /* ================================================= */
        /* ESTILOS PARA EL PANEL DE CALIFICACIÓN */
        /* ================================================= */

        .grupo-componente .modal-backdrop-solid {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: var(--dark-color);
            display: block;
            z-index: 1000;
            padding: 1rem 1rem 2rem 1rem; 
            box-sizing: border-box;
            overflow-y: auto;
            color: var(--text-color);
        }
        
        .grupo-componente .modal-content.asistencia-modal-content {
            background-color: var(--dark-color-alt); 
            padding: 20px;
            border-radius: 12px;
            width: 100%;
            max-width: 1200px; 
            margin: 4rem auto 0 auto; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        }
        
        /* Estilos para la fila de alumnos - AHORA MÁS ROBUSTA */
        .grupo-componente .asistencia-row {
            display: grid; 
            grid-template-columns: 250px 1fr 100px; /* Alumno (fijo) | Criterios (flexible) | Promedio (fijo) */
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid var(--dark-color);
            margin: 0 0 5px 0;
            background-color: var(--dark-color);
            border-radius: 6px;
        }

        .grupo-componente .alumno-nombre {
            padding-left: 15px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 500;
        }
        
        /* Contenedor de botones de criterios */
        .grupo-componente .bimestres-container {
            display: flex;
            flex-grow: 1;
            justify-content: flex-start;
            gap: 6px;
            padding: 0 10px;
            min-width: 100px; 
            max-width: 100%;
            overflow-x: auto; /* Permite scroll horizontal */
        }

        /* Estilo para los botones individuales de criterio */
        .grupo-componente .bimestre-header-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
            white-space: nowrap;
            flex-shrink: 0; /* EVITA QUE SE ENCOJA, MANTIENE EL TAMAÑO */
            border: 1px solid #555;
            border-radius: 6px;
            background-color: var(--dark-color-alt);
            cursor: pointer;
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
        }

        .grupo-componente .promedio-final-display {
            padding-right: 15px;
            text-align: right;
            font-weight: bold;
        }
        
        .grupo-componente .bimestre-desplegable {
            grid-column: 1 / -1; 
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease-out, padding 0.4s ease-out, margin 0.4s ease-out;
            padding: 0 20px;
            margin: 0;
            background-color: var(--dark-color-alt);
            border-radius: 0 0 12px 12px;
        }
        .grupo-componente .bimestre-desplegable.desplegado {
            max-height: 500px;
            padding: 20px;
            margin-bottom: 5px;
        }
        
        /* Contenedor de cuadritos de calificación - FLEX HORIZONTAL */
        .grupo-componente .cuadritos-grid {
            display: flex; 
            flex-wrap: nowrap;
            gap: 6px;
            align-items: center;
            overflow-x: auto; /* Permite scroll horizontal */
            padding-bottom: 10px;
        }
        
        /* Estilos de input y botón en el cuadritos-grid */
        .grupo-componente .cuadrito-calificacion {
            width: 38px; 
            height: 32px;
            background-color: #4a4a4a;
            border: 1px solid #777;
            border-radius: 4px;
            color: white;
            text-align: center; 
            font-weight: bold;
            font-family: var(--body-font);
            flex-shrink: 0; /* Asegura que no se achique */
        }
        
        /* FIX: OCULTAR FLECHITAS DE INPUT TYPE=NUMBER Y CENTRAR TEXTO */
        .grupo-componente .cuadrito-calificacion {
            -moz-appearance: textfield; 
        }
        .grupo-componente .cuadrito-calificacion::-webkit-outer-spin-button,
        .grupo-componente .cuadrito-calificacion::-webkit-inner-spin-button {
            -webkit-appearance: none; 
            margin: 0;
        }
        
        .grupo-componente .cuadrito-calificacion::placeholder {
            color: #999;
            font-size: 0.8em;
        }
        
        .grupo-componente .btn-agregar-dias {
            background-color: var(--main-color);
            color: var(--dark-color);
            border: none;
            border-radius: 4px;
            width: 38px;
            height: 32px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            flex-shrink: 0;
        }
        
        /* --- MODAL DE CRITERIOS (con mejoras de espaciado) --- */
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
            padding: 10px 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 400px; 
            text-align: center;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .grupo-componente .criterio-total.error strong {
            color: var(--danger-color);
        }

        /* --- OCULTAR BARRA DE SCROLL INTERNA --- */
        .grupo-componente .asistencia-body::-webkit-scrollbar {
            display: none;
        }
        .grupo-componente .asistencia-body {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        /* --- ESTILO DE SCROLLBAR PERSONALIZADO (Principal) --- */
        .grupo-componente .modal-backdrop-solid {
            /* Para Firefox */
            scrollbar-width: thin;
            scrollbar-color: var(--main-color) var(--dark-color-alt);
        }
        /* Para Webkit (Chrome, Safari, Edge) */
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
            background-color: #d4b03f; /* Un tono más claro del color principal */
        }
        
        /* Media Queries */
        @media (max-width: 768px) {
            .grupo-componente .trabajos-container {
                padding-top: 0;
            }
            .grupo-componente .main-header {
                flex-direction: column;
                align-items: flex-start;
                padding-top: 1rem;
            }
            .grupo-componente .main-header h1 {
                margin-bottom: 10px;
            }
            .grupo-componente .asistencia-row {
                grid-template-columns: 1fr; /* Columna única en móvil */
                gap: 10px;
                padding: 10px;
            }
            .grupo-componente .alumno-nombre {
                width: auto;
                padding-left: 0;
            }
            .grupo-componente .promedio-final-display {
                text-align: left;
                padding-right: 0;
            }
            .grupo-componente .bimestres-container {
                flex-wrap: wrap; /* Permitir que los botones se envuelvan */
                justify-content: space-between;
                padding: 0;
            }
            .grupo-componente .modal-content {
                max-width: 95%;
            }
            .grupo-componente .grupos-table {
                width: 100%;
                max-width: none;
            }
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
// --- 3. Sub-componente: Panel Principal de Calificaciones ---
// Modificado para usar criterios por bimestre.
// ======================================
const PanelCalificaciones = ({ grupo, asignatura, onVolver }) => {
    const [bimestreActivo, setBimestreActivo] = useState(1);
    // Estado MODIFICADO: Ahora guarda los criterios por número de bimestre (ej: {1: [], 2: [], 3: []})
    const [criteriosBimestre, setCriteriosBimestre] = useState({ 1: [], 2: [], 3: [] });
    const [calificaciones, setCalificaciones] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: null, tipo: '' });
    const [modalCriterios, setModalCriterios] = useState(false);
    const [criterioAbierto, setCriterioAbierto] = useState(null); 
    
    // Estado para controlar cuántas tareas se muestran por criterio (por defecto 10)
    const [numTareas, setNumTareas] = useState({}); 

    // Obtener los criterios del bimestre activo
    const criterios = criteriosBimestre[bimestreActivo] || [];


    useEffect(() => {
        const fetchCalificaciones = async () => {
            setIsLoadingData(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const res = await axios.get(`${API_URL}/calificaciones?grupoId=${grupo._id}&asignatura=${asignatura}`, config);
                
                // MODIFICADO: Al cargar, mapear los criterios al nuevo estado
                // Asumiendo que el backend devuelve un objeto como: { 1: [criterios], 2: [criterios] }
                setCriteriosBimestre(res.data?.criteriosBimestre || { 1: [], 2: [], 3: [] });
                setCalificaciones(res.data?.calificaciones || {});
                
                // Inicializa numTareas basado en los datos existentes o a 10
                const initialNumTareas = {1: {}, 2: {}, 3: {}};
                
                // Iterar sobre todos los bimestres y criterios para calcular maxIndex
                Object.keys(res.data?.criteriosBimestre || {}).forEach(bimestre => {
                    (res.data?.criteriosBimestre[bimestre] || []).forEach(criterio => {
                        let maxIndex = 0;
                        Object.values(res.data?.calificaciones || {}).forEach(alumnoCal => {
                            const tareas = alumnoCal[bimestre]?.[criterio.nombre];
                            if (tareas) {
                                const currentMax = Math.max(...Object.keys(tareas).map(Number));
                                if (currentMax >= maxIndex) maxIndex = currentMax + 1;
                            }
                        });
                        initialNumTareas[bimestre][criterio.nombre] = Math.max(10, maxIndex + 5);
                    });
                });
                
                setNumTareas(initialNumTareas);

                // Revisa los criterios del primer bimestre al cargar.
                if (!res.data || !res.data.criteriosBimestre || !res.data.criteriosBimestre[1] || res.data.criteriosBimestre[1].length === 0) {
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
        // MODIFICADO: Enviar criteriosBimestre al backend
        const payload = { grupoId: grupo._id, asignatura, criteriosBimestre, calificaciones };
        try {
            await axios.post(`${API_URL}/calificaciones`, payload, config);
            setNotificacion({ mensaje: '¡Calificaciones guardadas con éxito!', tipo: 'exito' });
        } catch (error) {
            setNotificacion({ mensaje: 'Error al guardar las calificaciones.', tipo: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    // Función para actualizar los criterios (llamada desde la modal)
    const handleGuardarCriteriosBimestre = (nuevosCriterios) => {
        setCriteriosBimestre(prev => ({
            ...prev,
            [bimestreActivo]: nuevosCriterios
        }));

        // Limpia el criterio abierto para evitar errores visuales si se modificó
        setCriterioAbierto(null); 
    };
    
    // Al cambiar de bimestre, si no hay criterios, abre la modal
    useEffect(() => {
        if (!isLoadingData) {
            if (!criteriosBimestre[bimestreActivo] || criteriosBimestre[bimestreActivo].length === 0) {
                setModalCriterios(true);
            }
        }
        // También cerramos el panel de tareas al cambiar de bimestre.
        setCriterioAbierto(null);
    }, [bimestreActivo, isLoadingData, criteriosBimestre]);
    

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
        // MODIFICADO: Usar los criterios del bimestre actual.
        const criteriosDelBimestre = criteriosBimestre[bimestre] || [];
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
        // Aumenta el contador de tareas mostradas en 5, almacenado por bimestre y criterio
        setNumTareas(prev => ({
            ...prev,
            [bimestreActivo]: {
                ...prev[bimestreActivo],
                [criterioNombre]: (prev[bimestreActivo]?.[criterioNombre] || 10) + 5
            }
        }));
    };

    if (isLoadingData) return <div className="trabajos-container grupo-componente" style={{textAlign: 'center', paddingTop: '10rem'}}><p style={{color: '#E9E9E9'}}>Cargando datos del grupo...</p></div>;

    return (
        <div className="modal-backdrop-solid grupo-componente"> 
            <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: null, tipo: '' })} />
            <div className="asistencia-modal-content">
                <header className="main-header" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
                    <h2>Calificaciones: {grupo.nombre} - {asignatura}</h2>
                    <div>
                        <button className="btn" onClick={() => setModalCriterios(true)}>Criterios del Bim. {bimestreActivo}</button>
                        <button className="btn btn-cancel" onClick={onVolver} style={{marginLeft: '10px'}}>Cerrar</button>
                    </div>
                </header>
                <div className="bimestre-selector">
                    {[1, 2, 3].map(bim => (
                        // Modificado: Al hacer clic, se cambia el bimestre activo.
                        <button key={bim} className={`btn ${bimestreActivo === bim ? 'btn-primary' : ''}`} onClick={() => setBimestreActivo(bim)}>Bimestre {bim}</button>
                    ))}
                </div>
                
                {/* MODIFICADO: Ahora verifica los criterios del bimestre activo */}
                {criterios.length > 0 ? (
                    <div className="asistencia-grid">
                        <div className="asistencia-body">
                            {grupo.alumnos.sort((a,b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)).map(alumno => (
                                <React.Fragment key={alumno._id}>
                                    <div className="asistencia-row">
                                        <div className="alumno-nombre">{`${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''} ${alumno.nombre}`}</div>
                                        <div className="bimestres-container">
                                            {/* MODIFICADO: Usamos los criterios del bimestre activo */}
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
                                                        {criterioAbierto.criterioNombre} ({criterios.find(c => c.nombre === criterioAbierto.criterioNombre)?.porcentaje}%)
                                                    </span>
                                                    <span className="criterio-prom" style={{color: calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre) >= 6 ? 'var(--dark-color)' : 'var(--danger-color)'}}>
                                                        Prom: {calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* FIN FIX */}

                                            <div className="cuadritos-grid">
                                                {/* Usamos numTareas[bimestreActivo][criterioAbierto.criterioNombre] para determinar cuántos inputs mostrar */}
                                                {Array.from({ length: numTareas[bimestreActivo]?.[criterioAbierto.criterioNombre] || 10 }).map((_, tareaIndex) => {
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
                    <div className="aviso-criterios">
                        <p>⚠️ **Bimestre {bimestreActivo}**: Por favor, define los criterios de evaluación para comenzar a calificar.</p>
                        <button className="btn btn-primary" onClick={() => setModalCriterios(true)}>Definir Criterios</button>
                    </div>
                )}
                <div className="modal-actions" style={{padding: '0 20px'}}>
                    <button className="btn btn-primary" onClick={guardarCalificaciones} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Calificaciones'}</button>
                </div>
            </div>
            {/* MODIFICADO: Pasar el bimestre y el manejador de guardado actualizado. */}
            {modalCriterios && (
                <ModalCriterios 
                    bimestre={bimestreActivo}
                    criteriosExistentes={criteriosBimestre[bimestreActivo]} 
                    criteriosAnteriores={bimestreActivo > 1 ? criteriosBimestre[bimestreActivo - 1] : []}
                    onGuardar={handleGuardarCriteriosBimestre} 
                    onClose={() => setModalCriterios(false)} 
                    setNotificacion={setNotificacion} 
                />
            )}
        </div>
    );
};

// ======================================
// --- 4. Componente: Lista de Grupos (sin cambios funcionales) ---
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
// --- 5. Componente: Modal para Criterios de Evaluación ---
// MODIFICADO para ser específico para cada bimestre.
// ======================================
const ModalCriterios = ({ bimestre, criteriosExistentes, criteriosAnteriores, onGuardar, onClose, setNotificacion }) => {
    const [criterios, setCriterios] = useState(criteriosExistentes || []);
    const [nombre, setNombre] = useState('');
    const [porcentaje, setPorcentaje] = useState('');
    const totalPorcentaje = criterios.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

    const addCriterio = () => {
        const porciento = parseInt(porcentaje, 10);
        // Validación de que el nombre no exista
        const nombreExiste = criterios.some(c => c.nombre.toLowerCase() === nombre.trim().toLowerCase());

        if (nombreExiste) {
            setNotificacion({ mensaje: `El criterio '${nombre}' ya existe.`, tipo: 'error' });
            return;
        }

        if (nombre.trim() && !isNaN(porciento) && porciento > 0 && totalPorcentaje + porciento <= 100) {
            setCriterios([...criterios, { nombre: nombre.trim(), porcentaje: porciento }]);
            setNombre(''); setPorcentaje('');
        } else { 
            setNotificacion({ mensaje: 'Verifica los datos. El total no debe exceder 100% y el criterio debe tener nombre y porcentaje válido.', tipo: 'error' });
        }
    };

    const removeCriterio = (index) => setCriterios(criterios.filter((_, i) => i !== index));

    // NUEVO: Función para copiar criterios del bimestre anterior
    const copiarCriteriosAnteriores = () => {
        if (criterios.length > 0 && !window.confirm(`Ya tienes criterios definidos. ¿Estás seguro de que quieres reemplazarlos con los del Bimestre ${bimestre - 1}?`)) {
            return;
        }
        if (criteriosAnteriores && criteriosAnteriores.length > 0) {
            setCriterios([...criteriosAnteriores]); // Copia superficial es suficiente
            setNotificacion({ mensaje: `Criterios del Bimestre ${bimestre - 1} copiados. ¡Recuerda Guardar!`, tipo: 'exito' });
        } else {
            setNotificacion({ mensaje: `No hay criterios definidos en el Bimestre ${bimestre - 1} para copiar.`, tipo: 'error' });
        }
    };

    const handleGuardar = () => {
        if (totalPorcentaje !== 100) { 
            setNotificacion({ mensaje: 'La suma de porcentajes debe ser exactamente 100%.', tipo: 'error' });
            return; 
        }
        onGuardar(criterios); // Se llama a la función en PanelCalificaciones para actualizar el estado por bimestre
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Definir Criterios de Evaluación - Bimestre {bimestre}</h2>
                {bimestre > 1 && (
                    <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
                        <button 
                            className="btn" 
                            onClick={copiarCriteriosAnteriores}
                            disabled={!criteriosAnteriores || criteriosAnteriores.length === 0}
                        >
                            📋 Copiar criterios del Bimestre {bimestre - 1}
                        </button>
                    </div>
                )}
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