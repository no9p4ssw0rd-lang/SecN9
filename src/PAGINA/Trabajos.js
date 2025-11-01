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
      // El temporizador se ajusta a 3.5s para coincidir con la animación CSS
      const timer = setTimeout(onClose, 3500); 
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
              position: absolute; /* Added position */
              right: 15px;
              top: 50%; /* Added top */
              transform: translateY(-50%); /* Added transform */
              color: #888;
              pointer-events: none; /* Added pointer-events */
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
// --- 3. Sub-componente: Panel Principal de Calificaciones ---
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
                        let maxIndex = -1;
                        Object.values(res.data?.calificaciones || {}).forEach(alumnoCal => {
                            const tareas = alumnoCal[bimestre]?.[criterio.nombre];
                            if (tareas) {
                                // Encontrar el índice más alto (tarea más reciente)
                                const currentMax = Math.max(...Object.keys(tareas).map(Number));
                                if (currentMax > maxIndex) maxIndex = currentMax;
                            }
                        });
                        // Si hay datos, mostramos al menos 5 tareas más que la última registrada.
                        // Si no hay datos, por defecto son 10.
                        initialNumTareas[criterio.nombre] = Math.max(initialNumTareas[criterio.nombre] || 10, maxIndex !== -1 ? maxIndex + 5 : 10);
                    });
                });
                
                setNumTareas(initialNumTareas);

                // CORRECCIÓN CLAVE: Abrir modal si el bimestre activo (por defecto 1) no tiene criterios definidos
                if (!fetchedCriterios || !fetchedCriterios[1] || fetchedCriterios[1].length === 0) {
                    setBimestreActivo(1); // Aseguramos que se vea el bimestre 1
                    setModalCriterios(true); // Abrimos el modal para forzar la definición
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
        
        // Validar si el bimestre activo tiene criterios antes de guardar
        if (criteriosBimestre[bimestreActivo].length === 0) {
            setNotificacion({ mensaje: `No se pueden guardar calificaciones del Bimestre ${bimestreActivo} sin criterios definidos.`, tipo: 'error' });
            setIsSaving(false);
            return;
        }

        // Enviar la nueva estructura de criterios (criteriosBimestre)
        const payload = { grupoId: grupo._id, asignatura, criterios: criteriosBimestre, calificaciones };
        try {
            await axios.post(`${API_URL}/calificaciones`, payload, config);
            setNotificacion({ mensaje: '¡Calificaciones y Criterios guardados con éxito!', tipo: 'exito' });
        } catch (error) {
            setNotificacion({ mensaje: 'Error al guardar las calificaciones. Intenta de nuevo.', tipo: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCalificacionChange = (alumnoId, bimestre, criterioNombre, tareaIndex, valor) => {
        // Validación de valor
        const notaFloat = valor === '' ? null : parseFloat(valor);
        if (notaFloat !== null && (isNaN(notaFloat) || notaFloat < 0 || notaFloat > 10)) return;
        
        // Objeto para guardar la nota
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
            .filter(entrada => entrada && typeof entrada.nota === 'number' && entrada.nota >= 0 && entrada.nota <= 10)
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
                    <h2>Calificaciones: {grupo.nombre} - <strong>{asignatura}</strong></h2>
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
                                        <div className="promedio-final-display" style={{color: calcularPromedioBimestre(alumno._id, bimestreActivo) >= 6.00 ? '#27ae60' : '#d32f2f'}}>
                                            <strong>{calcularPromedioBimestre(alumno._id, bimestreActivo)}</strong>
                                        </div>
                                    </div>
                                    {criterioAbierto?.alumnoId === alumno._id && (
                                        <div className={`bimestre-desplegable desplegado`}>
                                            
                                            {/* Contenedor para centrar el cuadro de resumen del criterio */}
                                            <div className="criterio-resumen-wrapper">
                                                <div className="criterio-resumen">
                                                    <span className="criterio-info">
                                                        <strong>{criterioAbierto.criterioNombre}</strong> ({criteriosDelBimestreActivo.find(c => c.nombre === criterioAbierto.criterioNombre)?.porcentaje}%)
                                                    </span>
                                                    <span className="criterio-prom" style={{color: calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre) >= 6 ? 'var(--dark-color)' : 'var(--danger-color)'}}>
                                                        Prom: <strong>{calcularPromedioCriterio(alumno._id, bimestreActivo, criterioAbierto.criterioNombre).toFixed(2)}</strong>
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
                    <button className="btn btn-primary" onClick={guardarCalificaciones} disabled={isSaving || criteriosDelBimestreActivo.length === 0}>{isSaving ? 'Guardando...' : 'Guardar Calificaciones'}</button>
                </div>
            </div>
            {/* Modal de Criterios */}
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
                                    <td><strong>{grupo.nombre}</strong></td>
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
// ======================================
const ModalCriterios = ({ bimestreActivo, criteriosExistentes, criteriosAnteriores, onGuardar, onClose, setNotificacion }) => {
    const [criterios, setCriterios] = useState(criteriosExistentes || []);
    const [nombre, setNombre] = useState('');
    const [porcentaje, setPorcentaje] = useState('');
    const totalPorcentaje = criterios.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

    const addCriterio = () => {
        const porciento = parseInt(porcentaje, 10);
        const nombreLimpio = nombre.trim();
        const criterioExistente = criterios.some(c => c.nombre.toLowerCase() === nombreLimpio.toLowerCase());

        if (criterioExistente) {
            setNotificacion({ mensaje: 'Ya existe un criterio con ese nombre.', tipo: 'error' });
            return;
        }

        if (nombreLimpio && !isNaN(porciento) && porciento > 0 && totalPorcentaje + porciento <= 100) {
            setCriterios([...criterios, { nombre: nombreLimpio, porcentaje: porciento }]);
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
                // Copia simple de los criterios del bimestre anterior
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
        // onClose(); // Se llama desde PanelCalificaciones al tener criterios guardados
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Título adaptado al bimestre activo */}
                <h2>Definir Criterios de Evaluación - Bimestre {bimestreActivo}</h2>

                {/* BOTÓN COPIAR */}
                {bimestreActivo > 1 && criterios.length === 0 && criteriosAnteriores.length > 0 && (
                    <div style={{marginBottom: '1rem', textAlign: 'center'}}>
                        <button 
                            className="btn btn-secondary" 
                            onClick={copiarCriteriosAnteriores}
                        >
                            <span style={{marginRight: '8px'}}>📄</span>Copiar del Bimestre {bimestreActivo - 1}
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
                        <input type="number" placeholder="40" min="1" max="100" value={porcentaje} onChange={e => setPorcentaje(e.target.value)} />
                    </div>
                    <button className="btn" onClick={addCriterio} disabled={totalPorcentaje >= 100 || !nombre.trim() || !porcentaje || parseInt(porcentaje, 10) <= 0}>Añadir</button>
                </div>
                <div className={`criterio-total ${totalPorcentaje !== 100 ? 'error' : ''}`}>
                    Total: <strong>{totalPorcentaje}%</strong> / 100%
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