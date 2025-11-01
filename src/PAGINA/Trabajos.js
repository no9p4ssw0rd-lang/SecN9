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
        {/* ======================================= */}
        {/* --- ESTILOS CSS INCLUIDOS AQUÍ --- */}
        {/* ======================================= */}
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

            /* ================================================= */
            /* ESTILOS EXCLUSIVOS PARA Trabajos.js               */
            /* ================================================= */

            /* --- FUENTES Y VARIABLES GLOBALES --- */
            .grupo-componente {
              --dark-color: #191D28;
              --dark-color-alt: #1E222D;
              --main-color: #b9972b;
              --title-color: #FFFFFF;
              --text-color: #E9E9E9;
              --danger-color: #d32f2f;
              --success-color: #27ae60;
              --warning-color: #f39c12;

              --body-font: 'Poppins', sans-serif;
              --font-semi-bold: 600;
            }

            /* --- ESTRUCTURA GENERAL Y TÍTULOS --- */
            .grupo-componente {
              font-family: var(--body-font);
              color: var(--text-color);
            }

            .grupo-componente .trabajos-container { /* Usando 'trabajos-container' */
              padding-top: 12rem; 
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
            /* ESTILOS PARA EL PANEL DE CALIFICACIÓN TIPO ASISTENCIA */
            /* ================================================= */

            .grupo-componente .modal-backdrop-solid {
              position: fixed;
              top: 0; left: 0;
              width: 100%; height: 100%;
              background-color: var(--dark-color);
              display: block;
              z-index: 1000;
              padding: 5rem 1rem 2rem 1rem;
              box-sizing: border-box;
              overflow-y: auto;
            }

            .grupo-componente .modal-content.asistencia-modal-content {
              background-color: transparent;
              padding: 0;
              border-radius: 0;
              width: 100%;
              max-width: none;
              box-shadow: none;
            }

            .grupo-componente .asistencia-grid {
              padding: 1rem 0;
            }

            .grupo-componente .asistencia-header {
              display: flex;
              align-items: center;
              padding: 0 10px 10px 10px;
              gap: 1rem;
              border-bottom: 1px solid #444;
              font-weight: var(--font-semi-bold);
              color: #aaa;
              font-size: 0.9rem;
            }

            .grupo-componente .asistencia-header .bimestres-container {
              text-align: center;
            }

            .grupo-componente .asistencia-body {
              max-height: 75vh;
              overflow-y: auto;
              padding-right: 10px;
            }

            .grupo-componente .asistencia-row {
              display: grid;
              grid-template-columns: 250px 1fr 100px;
              align-items: center;
              padding: 5px 10px;
              border-bottom: 1px solid var(--dark-color-alt);
            }

            .grupo-componente .alumno-nombre {
              padding-left: 15px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              font-weight: 500;
            }

            .grupo-componente .bimestres-container {
              display: flex;
              flex-grow: 1;
              justify-content: flex-start;
              gap: 6px;
            }

            .grupo-componente .bimestre-header-btn {
              text-align: center;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.3s;
              background-color: var(--dark-color-alt);
              color: var(--text-color);
              font-size: 0.8rem;
              white-space: nowrap;
              border: 1px solid #555;
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
              width: 100px;
              flex-shrink: 0;
              text-align: right;
              font-weight: bold;
              font-size: 1rem;
              color: var(--main-color);
              font-size: 1.1rem;
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

            .grupo-componente .asistencia-totales {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 1rem;
              font-weight: 500;
            }
            .grupo-componente .total-presentes {
              color: var(--success-color);
              font-weight: bold;
            }

            .grupo-componente .criterio-resumen-wrapper {
                display: flex;
                justify-content: center; /* Centra el resumen del criterio */
                width: 100%;
                margin-bottom: 10px;
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
            .grupo-componente .criterio-resumen .criterio-info {
                flex-grow: 1;
                text-align: left;
            }
            .grupo-componente .criterio-resumen .criterio-prom {
                font-size: 1.1em;
                margin-left: 10px;
            }

            .grupo-componente .cuadritos-grid {
              display: grid; 
              grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
              gap: 6px;
              align-items: center;
            }

            .grupo-componente .cuadrito-calificacion {
              width: 32px;
              height: 32px;
              background-color: #4a4a4a;
              border: 1px solid #777;
              border-radius: 4px;
              color: white;
              text-align: center;
              font-weight: bold;
              font-family: var(--body-font);
            }
            .grupo-componente .cuadrito-calificacion::placeholder {
                color: #999;
                font-size: 0.8em;
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
              background-color: var(--main-color);
              color: var(--dark-color);
              border: none;
              border-radius: 4px;
              width: 32px;
              height: 32px;
              font-weight: bold;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .grupo-componente .btn-agregar-dias:hover {
              transform: scale(1.1);
            }

            /* --- MODAL DE CRITERIOS (CON NUEVOS ESTILOS) --- */
            .grupo-componente .modal-overlay {
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background-color: rgba(0, 0, 0, 0.8);
              display: flex; justify-content: center; align-items: center; z-index: 1050;
            }

            .grupo-componente .modal-content {
              background-color: var(--dark-color-alt);
              padding: 2rem; border-radius: 12px; width: 90%;
              max-width: 600px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }

            .grupo-componente .modal-actions {
              display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;
            }

            .grupo-componente .criterio-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background-color: var(--dark-color);
              padding: 10px 15px;
              border-radius: 6px;
              margin-bottom: 10px;
            }
            .grupo-componente .criterio-item span {
              color: var(--text-color);
            }
            .grupo-componente .criterio-item span strong {
              color: var(--main-color);
            }
            .grupo-componente .criterio-item button {
              background-color: transparent;
              border: none;
              color: var(--danger-color);
              border-radius: 0;
              width: 24px;
              height: 24px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 1.2rem;
              transition: transform 0.2s;
            }
            .grupo-componente .criterio-item button:hover {
              transform: scale(1.2);
            }

            .grupo-componente .criterio-form {
              display: flex;
              gap: 10px;
              margin: 1.5rem 0;
              align-items: center;
            }
            .grupo-componente .criterio-form input {
              background: var(--dark-color);
              border: 1px solid #555;
              border-radius: 6px;
              color: var(--text-color);
              padding: 12px;
              box-sizing: border-box;
            }
            .grupo-componente .criterio-form input:focus {
                outline: none;
                border-color: var(--main-color);
            }
            .grupo-componente .criterio-form input::placeholder {
                color: #888;
            }
            .grupo-componente .criterio-form input[type="text"] { flex-grow: 3; }

            .grupo-componente .porcentaje-wrapper {
              position: relative;
              flex-grow: 1;
            }
            .grupo-componente .porcentaje-wrapper::after {
              content: '%';
              position: absolute;
              right: 15px;
              top: 50%;
              transform: translateY(-50%);
              color: #888;
              font-weight: bold;
              pointer-events: none;
            }
            .grupo-componente .criterio-form input[type="number"] {
              width: 100%;
              padding-right: 35px;
            }

            .grupo-componente .criterio-form .btn {
              padding: 12px;
              background-color: var(--dark-color);
              color: var(--text-color);
              border: 1px solid #555;
            }
            .grupo-componente .criterio-form .btn:hover {
              background-color: #000;
              border-color: var(--main-color);
            }

            .grupo-componente .criterio-total {
              text-align: right; font-size: 1.1rem; font-weight: bold;
              margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #444;
              color: var(--text-color);
            }
            .grupo-componente .aviso-criterios {
              text-align: center; padding: 3rem; background-color: var(--dark-color-alt);
              border-radius: 8px; margin: 2rem;
            }
            .grupo-componente .aviso-criterios p {
              margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--warning-color);
            }

            /* --- OCULTAR BARRA DE SCROLL INTERNA --- */
            .grupo-componente .asistencia-body::-webkit-scrollbar {
              display: none;
            }
            .grupo-componente .asistencia-body {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            /* --- ESTILO DE SCROLLBAR PERSONALIZADO --- */
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
            /* ================================================= */
            /* ESTILOS PARA LA NOTIFICACIÓN FLOTANTE (ALERTA) */
            /* ================================================= */

            .notificacion-flotante {
                position: fixed;
                /* Centrado horizontal */
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2000; 

                padding: 12px 25px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.9rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

                /* Animación inicial */
                opacity: 0;
                visibility: hidden;
                /* La animación total es 3.5s, sincronizada con el setTimeout de 3s en React */
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
                0% {
                    opacity: 0;
                    visibility: hidden;
                    transform: translate(-50%, -20px);
                }
                5% {
                    opacity: 1;
                    visibility: visible;
                    transform: translate(-50%, 0); /* Baja a su posición */
                }
                90% {
                    opacity: 1;
                    visibility: visible;
                    transform: translate(-50%, 0); 
                }
                100% {
                    opacity: 0;
                    visibility: hidden;
                    transform: translate(-50%, -20px); /* Se eleva y desaparece */
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
// MODIFICADO: Adaptado para criterios por bimestre y lógica de inicialización.
// ======================================
const PanelCalificaciones = ({ grupo, asignatura, onVolver }) => {
    const [bimestreActivo, setBimestreActivo] = useState(1);
    // CAMBIO CLAVE: Criterios ahora es un objeto, indexado por bimestre (1, 2, 3)
    const [criteriosBimestre, setCriteriosBimestre] = useState({ 1: [], 2: [], 3: [] });
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
                // Se asume que el backend devuelve los criterios en un formato { 1: [...], 2: [...], 3: [...] }
                const res = await axios.get(`${API_URL}/calificaciones?grupoId=${grupo._id}&asignatura=${asignatura}`, config);
                
                // Adaptar la carga de criterios al formato por bimestre
                const fetchedCriterios = res.data?.criterios || {};
                setCriteriosBimestre({ 
                    1: fetchedCriterios[1] || [], 
                    2: fetchedCriterios[2] || [], 
                    3: fetchedCriterios[3] || [] 
                });
                setCalificaciones(res.data?.calificaciones || {});
                
                // Lógica para inicializar numTareas basada en datos existentes
                let initialNumTareas = {};
                Object.keys(fetchedCriterios).forEach(bimestre => {
                    (fetchedCriterios[bimestre] || []).forEach(criterio => {
                        let maxIndex = 0;
                        Object.values(res.data?.calificaciones || {}).forEach(alumnoCal => {
                            const tareas = alumnoCal[bimestre]?.[criterio.nombre];
                            if (tareas) {
                                const currentMax = Math.max(...Object.keys(tareas).map(Number));
                                if (currentMax >= maxIndex) maxIndex = currentMax + 1;
                            }
                        });
                        initialNumTareas[criterio.nombre] = Math.max(initialNumTareas[criterio.nombre] || 10, maxIndex + 5);
                    });
                });
                
                setNumTareas(initialNumTareas);

                // Abrir modal si el bimestre 1 no tiene criterios definidos
                if (!fetchedCriterios || !fetchedCriterios[1] || fetchedCriterios[1].length === 0) {
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

    // Función para actualizar los criterios de UN bimestre específico
    const handleGuardarCriterios = useCallback((bimestre, nuevosCriterios) => {
        setCriteriosBimestre(prev => ({
            ...prev,
            [bimestre]: nuevosCriterios
        }));
        // Si hay criterios después de guardar, cerramos el modal
        if (nuevosCriterios.length > 0) {
            setModalCriterios(false);
        }
    }, []);


    const guardarCalificaciones = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Enviar la nueva estructura de criterios (criteriosBimestre)
        const payload = { grupoId: grupo._id, asignatura, criterios: criteriosBimestre, calificaciones };
        try {
            await axios.post(`${API_URL}/calificaciones`, payload, config);
            setNotificacion({ mensaje: '¡Calificaciones y Criterios guardados con éxito!', tipo: 'exito' });
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

    // Obtener los criterios del bimestre activo para usar en la renderización
    const criteriosDelBimestreActivo = criteriosBimestre[bimestreActivo] || [];
    
    const calcularPromedioCriterio = (alumnoId, bimestre, criterioNombre) => {
        const tareas = calificaciones[alumnoId]?.[bimestre]?.[criterioNombre] || {};
        const notasValidas = Object.values(tareas)
            .filter(entrada => entrada && typeof entrada.nota === 'number')
            .map(entrada => entrada.nota);

        if (notasValidas.length === 0) return 0;
        const total = notasValidas.reduce((sum, nota) => sum + nota, 0);
        return total / notasValidas.length;
    };

    // Función adaptada para usar los criterios del bimestre solicitado
    const calcularPromedioBimestre = (alumnoId, bimestre) => {
        const criterios = criteriosBimestre[bimestre] || [];
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


    if (isLoadingData) return <div className="trabajos-container grupo-componente" style={{textAlign: 'center', paddingTop: '10rem'}}><p style={{color: '#E9E9E9'}}>Cargando datos del grupo...</p></div>;

    return (
        <div className="modal-backdrop-solid grupo-componente"> 
            <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: null, tipo: '' })} />
            <div className="asistencia-modal-content">
                <header className="main-header" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
                    <h2>Calificaciones: {grupo.nombre} - {asignatura}</h2>
                    <div>
                        <button className="btn" onClick={() => setModalCriterios(true)}>Criterios (Bim. {bimestreActivo})</button>
                        <button className="btn btn-cancel" onClick={onVolver} style={{marginLeft: '10px'}}>Cerrar</button>
                    </div>
                </header>
                <div className="bimestre-selector">
                    {[1, 2, 3].map(bim => (
                        <button 
                            key={bim} 
                            className={`btn ${bimestreActivo === bim ? 'btn-primary' : ''}`} 
                            onClick={() => {
                                setBimestreActivo(bim);
                                setCriterioAbierto(null); // Limpiar criterio abierto al cambiar de bimestre
                            }}
                        >
                            Bimestre {bim}
                        </button>
                    ))}
                </div>
                
                {/* Mostrar aviso si no hay criterios definidos para el bimestre activo */}
                {criteriosDelBimestreActivo.length > 0 ? (
                    <div className="asistencia-grid">
                        <div className="asistencia-body">
                            {grupo.alumnos.sort((a,b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)).map(alumno => (
                                <React.Fragment key={alumno._id}>
                                    <div className="asistencia-row">
                                        <div className="alumno-nombre">{`${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''} ${alumno.nombre}`}</div>
                                        <div className="bimestres-container">
                                            {/* Iterar sobre criteriosDelBimestreActivo */}
                                            {criteriosDelBimestreActivo.map(criterio => (
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
                                            
                                            {/* Contenedor para centrar el cuadro de resumen del criterio */}
                                            <div className="criterio-resumen-wrapper">
                                                <div className="criterio-resumen">
                                                    <span className="criterio-info">
                                                        {criterioAbierto.criterioNombre} ({criteriosDelBimestreActivo.find(c => c.nombre === criterioAbierto.criterioNombre)?.porcentaje}%)
                                                    </span>
                                                    <span className="criterio-prom" style={{color: calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre) >= 6 ? 'var(--dark-color)' : 'var(--danger-color)'}}>
                                                        Prom: {calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre).toFixed(2)}
                                                    </span>
                                                </div>
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
                        <p>⚠️ Por favor, define los criterios de evaluación para el **Bimestre {bimestreActivo}**.</p>
                        <button className="btn btn-primary" onClick={() => setModalCriterios(true)}>Definir Criterios</button>
                    </div>
                )}
                <div className="modal-actions" style={{padding: '0 20px'}}>
                    <button className="btn btn-primary" onClick={guardarCalificaciones} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Calificaciones'}</button>
                </div>
            </div>
            {/* Pasar el bimestre activo y la función de guardado con el bimestre */}
            {modalCriterios && (
                <ModalCriterios 
                    bimestreActivo={bimestreActivo}
                    criteriosExistentes={criteriosBimestre[bimestreActivo] || []} 
                    criteriosAnteriores={bimestreActivo > 1 ? criteriosBimestre[bimestreActivo - 1] : []}
                    onGuardar={(nuevosCriterios) => handleGuardarCriterios(bimestreActivo, nuevosCriterios)} 
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
// --- 5. Componente: Modal para Criterios de Evaluación ---
// MODIFICADO: Añadida opción para copiar del bimestre anterior
// ======================================
const ModalCriterios = ({ bimestreActivo, criteriosExistentes, criteriosAnteriores, onGuardar, onClose, setNotificacion }) => {
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

    // NUEVA FUNCIÓN: Copiar criterios del bimestre anterior
    const copiarCriteriosAnteriores = () => {
        if (criteriosAnteriores && criteriosAnteriores.length > 0) {
            const totalAnterior = criteriosAnteriores.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
            if (totalAnterior === 100) {
                setCriterios(criteriosAnteriores);
                setNotificacion({ mensaje: `Criterios copiados del Bimestre ${bimestreActivo - 1}.`, tipo: 'exito' });
            } else {
                 setNotificacion({ mensaje: 'Los criterios anteriores no suman 100%. Debes ajustarlos.', tipo: 'error' });
            }
        }
    };


    const handleGuardar = () => {
        if (totalPorcentaje !== 100) { 
            setNotificacion({ mensaje: 'La suma de porcentajes debe ser exactamente 100%.', tipo: 'error' });
            return; 
        }
        onGuardar(criterios); // onGuardar ahora sabe a qué bimestre guardar.
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Título adaptado al bimestre activo */}
                <h2>Definir Criterios de Evaluación - Bimestre {bimestreActivo}</h2>

                {/* BOTÓN COPIAR */}
                {bimestreActivo > 1 && criteriosExistentes.length === 0 && criteriosAnteriores.length > 0 && (
                    <div style={{marginBottom: '1rem', textAlign: 'center'}}>
                        <button 
                            className="btn btn-secondary" 
                            onClick={copiarCriteriosAnteriores}
                            style={{padding: '10px 20px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
                        >
                            Copiar del Bimestre {bimestreActivo - 1}
                        </button>
                    </div>
                )}
                {/* FIN BOTÓN COPIAR */}

                {criterios.map((c, index) => (
                    <div key={index} className="criterio-item">
                        <span>{c.nombre} - <strong>{c.porcentaje}%</strong></span>
                        <button onClick={() => removeCriterio(index)}>X</button>
                    </div>
                ))}
                <div className="criterio-form">
                    <input type="text" placeholder="Nombre (Ej: Tareas)" value={nombre} onChange={e => setNombre(e.target.value)} />
                    <div className="porcentaje-wrapper">
                        <input type="number" placeholder="Porcentaje (Ej: 40)" min="1" max="100" value={porcentaje} onChange={e => setPorcentaje(e.target.value)} />
                    </div>
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