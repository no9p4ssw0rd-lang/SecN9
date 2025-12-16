import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import ConfirmacionModal from "./ConfirmacionModal";

// La URL de tu backend ahora se leerá desde las variables de entorno
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";


function Home({ user }) {


  const [profesores, setProfesores] = useState([]);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [asignaturasSelect, setAsignaturasSelect] = useState([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [alerta, setAlerta] = useState(null); // Nuevo estado para alertas



  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 3000);
  };

  // Se mantiene el useEffect para cargar profesores solo si es admin
  useEffect(() => {
    if (user?.role === "admin") {
      fetchProfesores();
      fetchMaterias(); // NUEVO: Cargar materias
    }
  }, [user]);

  // Se omite el useEffect de navegación/scroll del código viejo para centrarse en la funcionalidad principal.

  const fetchProfesores = () => {
    const token = localStorage.getItem("token");
    if (!token) return console.error("⚠️ No hay token guardado.");

    // Uso de API_URL para compatibilidad con Render/Vercel
    axios.get(`${API_URL}/auth/profesores`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setProfesores(res.data || []))
      .catch((err) => {
        console.error("Error al obtener profesores:", err);
        mostrarAlerta("No se pudieron cargar los profesores.", "error"); // Alerta del código nuevo
      });
  };

  // NUEVO: Función para cargar materias desde la BD
  const [materiasDb, setMateriasDb] = useState([]);
  const [nuevaMateria, setNuevaMateria] = useState("");

  // Estados para Edición/Eliminación de Materias
  const [materiaToDelete, setMateriaToDelete] = useState(null); // Materia a eliminar
  const [materiaToEdit, setMateriaToEdit] = useState(null); // Materia a editar (objeto)
  const [editMateriaName, setEditMateriaName] = useState(""); // Nombre nuevo para edición

  const fetchMaterias = () => {
    const token = localStorage.getItem("token");
    axios.get(`${API_URL}/api/materias`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setMateriasDb(res.data || []);
      })
      .catch((err) => console.error("Error al cargar materias:", err));
  };

  const handleAddMateria = () => {
    if (!nuevaMateria.trim()) return;
    const token = localStorage.getItem("token");
    axios.post(`${API_URL}/api/materias`, { nombre: nuevaMateria.toUpperCase() }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        mostrarAlerta("Materia agregada.", "success");
        setNuevaMateria("");
        fetchMaterias();
      })
      .catch((err) => mostrarAlerta(err.response?.data?.error || "Error al agregar materia.", "error"));
  };

  // --- Lógica de Eliminación (con Modal) ---
  const requestDeleteMateria = (materia) => {
    setMateriaToDelete(materia);
  };

  const confirmDeleteMateria = () => {
    if (!materiaToDelete) return;
    const token = localStorage.getItem("token");
    axios.delete(`${API_URL}/api/materias/${materiaToDelete._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        mostrarAlerta("Materia eliminada y desasignada.", "success");
        // FIX: Eliminar la materia de la selección local inmediatamente
        setAsignaturasSelect((prev) => prev.filter((m) => m !== materiaToDelete.nombre));
        fetchMaterias();
        fetchProfesores(); // FIX: Refrescar profesores para reflejar la eliminación
        setMateriaToDelete(null);
      })
      .catch((err) => {
        mostrarAlerta("Error al eliminar materia.", "error");
        setMateriaToDelete(null);
      });
  };

  // --- Lógica de Edición ---
  const openEditMateria = (materia) => {
    setMateriaToEdit(materia);
    setEditMateriaName(materia.nombre);
  };

  const saveEditMateria = () => {
    if (!materiaToEdit || !editMateriaName.trim()) return;
    const token = localStorage.getItem("token");
    axios.put(`${API_URL}/api/materias/${materiaToEdit._id}`, { nombre: editMateriaName.toUpperCase() }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        mostrarAlerta("Materia actualizada correctamente.", "success");
        fetchMaterias();
        fetchProfesores(); // FIX: Refrescar profesores para reflejar el cambio de nombre
        setMateriaToEdit(null);
        setEditMateriaName("");
      })
      .catch((err) => mostrarAlerta(err.response?.data?.error || "Error al actualizar materia.", "error"));
  };

  const handleDeleteMateria = (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta materia?")) return;
    const token = localStorage.getItem("token");
    axios.delete(`${API_URL}/api/materias/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        mostrarAlerta("Materia eliminada.", "success");
        fetchMaterias();
      })
      .catch((err) => mostrarAlerta("Error al eliminar materia.", "error"));
  };
  // --- Novedades Carousel ---
  const novedadesList = [
    { icon: "📅", text: "Asignación de Asesores: Ahora puedes asignar un asesor a cada grupo." },
    { icon: "🎓", text: "Director Global: Configura el director una vez para todas las boletas." },
    { icon: "📄", text: "Boletas PDF: Firmas automáticas y diseño mejorado." },
    { icon: "✨", text: "Interfaz Renovada: Botones y controles más intuitivos." }
  ];

  const [currentNovedad, setCurrentNovedad] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNovedad((prev) => (prev + 1) % novedadesList.length);
    }, 7000); // 7 segundos (Updated)
    return () => clearInterval(interval);
  }, []);

  // --- Dentro del componente Home ---
  const [showSubjects, setShowSubjects] = useState(false); // Estado para expandir modal


  const openModal = (profesor) => {
    setSelectedProfesor(profesor);
    setAsignaturasSelect(profesor.asignaturas || []);
    setShowSubjects(false); // Reset al abrir
    setModalVisible(true);
    setConfirmDeleteVisible(false);
  };


  const closeModal = () => {
    setModalVisible(false);
    setSelectedProfesor(null);
    setConfirmDeleteVisible(false);
    setAsignaturasSelect([]);
  };

  // Lógica de Cloudinary/Imagen por URL completa o placeholder
  const profileImgUrl = (foto) => {
    if (foto && foto.startsWith("http")) {
      return foto;
    }
    return `https://placehold.co/150x150/EFEFEF/AAAAAA&text=Sin+Foto`;
  };

  const handleAsignaturasChange = (materia) => {
    setAsignaturasSelect((prev) =>
      prev.includes(materia) ? prev.filter((m) => m !== materia) : [...prev, materia]
    );
  };

  const guardarAsignaturas = () => {
    if (!selectedProfesor) return;
    const token = localStorage.getItem("token");
    axios.put(`${API_URL}/auth/profesores/${selectedProfesor._id}/asignaturas`, { asignaturas: asignaturasSelect }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        mostrarAlerta("Asignaturas actualizadas.", "success");
        fetchProfesores();
        closeModal();
      })
      .catch((err) => {
        console.error("Error al guardar asignaturas:", err);
        mostrarAlerta("Error al guardar las asignaturas.", "error");
      });
  };

  const handleDeleteClick = () => setConfirmDeleteVisible(true);

  const confirmDelete = () => {
    if (!selectedProfesor) return;
    const token = localStorage.getItem("token");
    axios.delete(`${API_URL}/auth/profesores/${selectedProfesor._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        mostrarAlerta("Profesor eliminado correctamente.", "success");
        fetchProfesores();
        closeModal();
      })
      .catch((err) => {
        console.error("Error al eliminar profesor:", err);
        mostrarAlerta("Error al eliminar el profesor.", "error");
      });
  };

  const cancelDelete = () => setConfirmDeleteVisible(false);

  // --- JSX del Modal ---
  const primerNombre = user?.nombre ? user.nombre.split(" ")[0] : "";

  return (
    <>
      {alerta && <div className={`alerta-fixed ${alerta.tipo}`}>{alerta.mensaje}</div>}

      <section className="home section" id="home">
        <div className="home-container container grid">
          <div className="home-data">
            <h1 className="home-title">
              {user ? (
                <>Bienvenido <span className="user-name-gold">{primerNombre}</span> al sistema de <span>gestión académica</span></>
              ) : (
                <>Bienvenido al sistema de <span>gestión académica</span></>
              )}
            </h1>
            {!user && <p>Por favor inicia sesión para acceder a todas las funciones.</p>}
          </div>
        </div>
      </section>

      {!user && (
        <section className="novedades section" id="novedades">
          <h2 className="section-title">Últimas Actualizaciones</h2>
          <div className="novedades-container container">
            <div className="novedad-item fade-in" key={currentNovedad} style={{ maxWidth: '100%', justifyContent: 'center' }}>
              <span className="novedad-icon">{novedadesList[currentNovedad].icon}</span>
              <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>{novedadesList[currentNovedad].text}</p>
            </div>
          </div>
        </section>
      )}

      {user?.role === "admin" && (
        <section className="profesores section" id="profesores">
          <h2 className="section-title">Perfiles de Profesores</h2>
          <div className="profesores-table-container">
            <table className="profesores-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Asignaturas</th>
                  <th>Fecha de Registro</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {profesores.length > 0 ? profesores.map((prof) => (
                  <tr key={prof._id}>
                    <td>{prof.nombre}</td>
                    <td>{prof.asignaturas?.join(", ") || "No asignada"}</td>
                    <td>{prof.fechaRegistro ? new Date(prof.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
                    <td><button className="btn-ver-perfil" onClick={() => openModal(prof)}>Ver perfil</button></td>
                  </tr>
                )) : <tr><td colSpan="4">Cargando profesores...</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL PROFESOR */}
      {modalVisible && selectedProfesor && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-content ${showSubjects ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <div className="modal-body-grid">

              {/* Columna Izquierda: Perfil */}
              <div className="modal-left-column">
                <img
                  src={profileImgUrl(selectedProfesor.foto)}
                  alt={selectedProfesor.nombre}
                  className="profile-img-modal"
                />
                <h3>{selectedProfesor.nombre}</h3>

                <div className="profesor-details" style={{ width: '100%', textAlign: 'left' }}>
                  <p><b>Correo:</b> {selectedProfesor.email}</p>
                  <p><b>Celular:</b> {selectedProfesor.celular}</p>
                  {/* <p><b>Edad:</b> {selectedProfesor.edad}</p> */}
                  {/* <p><b>Sexo:</b> {selectedProfesor.sexo}</p> */}
                  <p><b>Registro:</b> {selectedProfesor.fechaRegistro ? new Date(selectedProfesor.fechaRegistro).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div style={{ width: '100%', marginTop: '1rem', textAlign: 'left' }}>
                  <h4>Asignaturas Actuales:</h4>
                  {asignaturasSelect.length > 0 ? (
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {asignaturasSelect.map(a => <li key={a}>{a}</li>)}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '1rem' }}>Ninguna asignatura asignada.</p>
                  )}
                </div>

                {/* Botón para expandir si NO está expandido */}
                {!showSubjects && (
                  <button className="btn-open-gestion" onClick={() => setShowSubjects(true)}>
                    Gestión de Materias
                  </button>
                )}
              </div>

              {/* Columna Derecha: Gestión (Solo visible si showSubjects es true por CSS) */}
              <div className="modal-right-column">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="asignaturas-title"><b>CATÁLOGO DE MATERIAS</b></p>
                  <button onClick={() => setShowSubjects(false)} style={{ background: 'none', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                    Cerrar Gestión
                  </button>
                </div>

                <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}>Selecciona las materias del catálogo:</p>

                {/* Gestión de Materias (Agregar) */}
                <div className="manage-materias-container">
                  <input
                    type="text"
                    placeholder="Nueva Materia..."
                    value={nuevaMateria}
                    onChange={(e) => setNuevaMateria(e.target.value)}
                  />
                  <button className="btn-add-materia" onClick={handleAddMateria} title="Agregar Materia">+</button>
                </div>

                {/* GRID de Materias (Horizontal) */}
                <div className="subject-grid">
                  {materiasDb.length > 0 ? materiasDb.map((m) => (
                    <div key={m._id} className="checkbox-item">
                      {materiaToEdit && materiaToEdit._id === m._id ? (
                        <div style={{ display: 'flex', flex: 1, gap: '5px' }}>
                          <input
                            type="text"
                            value={editMateriaName}
                            onChange={(e) => setEditMateriaName(e.target.value)}
                            className="edit-materia-input"
                            style={{ width: '100%' }}
                          />
                          <button onClick={saveEditMateria} style={{ cursor: 'pointer', color: 'green' }}>💾</button>
                          <button onClick={() => setMateriaToEdit(null)} style={{ cursor: 'pointer', color: 'red' }}>❌</button>
                        </div>
                      ) : (
                        <>
                          <label className="checkbox-label" style={{ flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              value={m.nombre}
                              checked={asignaturasSelect.includes(m.nombre)}
                              onChange={() => handleAsignaturasChange(m.nombre)}
                              style={{ transform: 'scale(1.2)', marginRight: '10px' }}
                            />
                            <span style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{m.nombre}</span>
                          </label>
                          <div className="materia-actions" style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="btn-edit-materia"
                              onClick={() => openEditMateria(m)}
                              title="Editar"
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-delete-materia-icon"
                              onClick={() => requestDeleteMateria(m)}
                              title="Eliminar"
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <p>No hay materias registradas.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal de confirmación para eliminar materia */}
            <ConfirmacionModal
              isOpen={!!materiaToDelete}
              onClose={() => setMateriaToDelete(null)}
              onConfirm={confirmDeleteMateria}
              mensaje={`¿Estás seguro de que deseas eliminar la materia "${materiaToDelete?.nombre}"? Esta acción la eliminará también de todos los profesores asignados.`}
              confirmText="Sí, Eliminar"
              cancelText="Cancelar"
            />

            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardarAsignaturas}>Guardar asignaturas</button>
              {!confirmDeleteVisible && <button className="btn-eliminar" onClick={handleDeleteClick}>Eliminar profesor</button>}
            </div>

            {confirmDeleteVisible && (
              <div className="mini-alert">
                <p>¿Seguro que deseas eliminar a {selectedProfesor.nombre}?</p>
                <div className="mini-alert-buttons">
                  <button className="mini-alert-yes" onClick={confirmDelete}>Sí, Eliminar</button>
                  <button className="mini-alert-no" onClick={cancelDelete}>No</button>
                </div>
              </div>
            )}

            {/* Added extra padding for the bottom info */}
            <div style={{ marginTop: '1rem' }}>
              <p className="fecha-registro"><b>Fecha de registro:</b> {selectedProfesor.fechaRegistro ? new Date(selectedProfesor.fechaRegistro).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;