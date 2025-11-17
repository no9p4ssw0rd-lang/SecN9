import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import { useNavigate } from "react-router-dom"; 
// La URL de tu backend ahora se leerá desde las variables de entorno
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";


function Home({ user }) {
 
  const [profesores, setProfesores] = useState([]);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [asignaturasSelect, setAsignaturasSelect] = useState([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [alerta, setAlerta] = useState(null); // Estado para alertas

  // 🔑 CAMBIO 1: Mover la lista de materias a un estado (para que pueda ser modificada)
  const [materiasDisponibles, setMateriasDisponibles] = useState([
    "MATEMATICAS COOR.ACADEMICA", "TUTORIA", "ESPAÑOL", "INGLES TUTORIA", "INGLES","LENGUA EXTRANJERA",
    "MATEMATICAS", "CIENCIAS I", "CIENCIAS II", "CIENCIAS III", "ELECTRONICA","INTEGRACION CURRICULAR","FISICA",
    "INDUSTRIA DEL VESTIDO", "DISEÑO ARQUIT.", "INFORMATICA", "GEOGRAFIA","TECNOLOGÍA",
    "HISTORIA", "F.CIVICA y ETICA", "F.CIVICA y ETICA-A.C", "F.CIVICA y ETICA-A.C TUTORIA",
    "ARTES", "EDUCACION FISICA",
  ]);
  
  // 🔑 NUEVO ESTADO: Para el campo de nueva materia
  const [nuevaMateria, setNuevaMateria] = useState('');


  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 3000);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchProfesores();
    }
    // ⚠️ Nota: Como la lista es Fija/Local, no hay un fetchMaterias del backend.
  }, [user]);

  const fetchProfesores = () => {
    const token = localStorage.getItem("token");
    if (!token) return console.error("⚠️ No hay token guardado.");
    
    axios.get(`${API_URL}/auth/profesores`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setProfesores(res.data || []))
      .catch((err) => {
        console.error("Error al obtener profesores:", err);
        mostrarAlerta("No se pudieron cargar los profesores.", "error");
      });
  };

  const openModal = (profesor) => {
    setSelectedProfesor(profesor);
    setAsignaturasSelect(profesor.asignaturas || []);
    setModalVisible(true);
    setConfirmDeleteVisible(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProfesor(null);
    setConfirmDeleteVisible(false);
    setAsignaturasSelect([]);
  };

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

  // 🔑 NUEVA FUNCIÓN: Para agregar una materia al estado local
  const handleAgregarMateria = (e) => {
    e.preventDefault();
    const materiaNormalizada = nuevaMateria.trim().toUpperCase();
    
    if (!materiaNormalizada) {
      return mostrarAlerta("El nombre de la materia no puede estar vacío.", "error");
    }
    if (materiasDisponibles.includes(materiaNormalizada)) {
      return mostrarAlerta(`La materia "${materiaNormalizada}" ya existe.`, "error");
    }

    // Agrega la nueva materia al estado local (solo visible mientras la app esté activa)
    setMateriasDisponibles(prev => [...prev, materiaNormalizada]);
    setNuevaMateria('');
    mostrarAlerta(`Materia "${materiaNormalizada}" agregada con éxito (Local).`, "success");
  };

  // 🔑 NUEVA FUNCIÓN: Para eliminar una materia del estado local
  const handleEliminarMateria = (materia) => {
    setMateriasDisponibles(prev => prev.filter(m => m !== materia));
    // También la quita de las asignaturas seleccionadas si estaba allí
    setAsignaturasSelect(prev => prev.filter(m => m !== materia));
    mostrarAlerta(`Materia "${materia}" eliminada con éxito (Local).`, "success");
  };


  const primerNombre = user?.nombre ? user.nombre.split(" ")[0] : "";
  
  return (
    <>
      {alerta && <div className={`alerta-fixed ${alerta.tipo}`}>{alerta.mensaje}</div>}

      <section className="home section" id="home">
        <div className="home-container container grid">
          <div className="home-data">
            <h1 className="home-title">
              {user ? (
                <>Bienvenido <span className="user-name-gold">{primerNombre}</span> al sistema de <span>asistencia</span></>
              ) : (
                <>Bienvenido al sistema de <span>asistencia</span></>
              )}
            </h1>
            {!user && <p>Por favor inicia sesión para acceder a todas las funciones.</p>}
          </div>
        </div>
      </section>
      
      ---

      {/* 🔑 NUEVA SECCIÓN: Administración de Materias (Solo Admin) */}
      {user?.role === "admin" && (
        <section className="admin-materias section" id="admin-materias">
          <h2 className="section-title">⚙️ Administración de Materias</h2>
          
          {/* Formulario para agregar */}
          <form onSubmit={handleAgregarMateria} className="add-materia-form">
            <input
              type="text"
              placeholder="Nombre de la nueva materia (Ej: DEPORTE)"
              value={nuevaMateria}
              onChange={(e) => setNuevaMateria(e.target.value)}
              className="input-materia"
            />
            <button type="submit" className="btn-agregar-materia">Agregar Materia</button>
          </form>

          {/* Lista de materias para eliminar */}
          <div className="materias-list-container">
            <h3>Materias Actuales ({materiasDisponibles.length})</h3>
            <ul className="materias-list">
              {materiasDisponibles.map((m) => (
                <li key={m}>
                  <span>{m}</span>
                  <button 
                    onClick={() => handleEliminarMateria(m)} 
                    className="btn-quitar-materia"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      
      ---

      {/* PROFESORES ADMIN */}
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
                {profesores.map((prof) => (
                  <tr key={prof._id}>
                    <td>{prof.nombre}</td>
                    <td>{prof.asignaturas?.join(", ") || "No asignada"}</td>
                    <td>{prof.fechaRegistro ? new Date(prof.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
                    <td><button className="btn-ver-perfil" onClick={() => openModal(prof)}>Ver perfil</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      ---

      {/* MODAL PROFESOR (Usa materiasDisponibles) */}
      {modalVisible && selectedProfesor && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <img 
              src={profileImgUrl(selectedProfesor.foto)} 
              alt={selectedProfesor.nombre} 
              className="profile-img-modal" 
            />
            <h3>{selectedProfesor.nombre}</h3>
            
            <div className="profesor-details">
              <p><b>Correo:</b> {selectedProfesor.email}</p>
              <p><b>Celular:</b> {selectedProfesor.celular}</p>
              <p><b>Edad:</b> {selectedProfesor.edad}</p>
              <p><b>Sexo:</b> {selectedProfesor.sexo}</p>
            </div>

            <p className="asignaturas-title"><b>Asignaturas:</b></p>
            <div className="checkbox-group">
              {/* 🔑 CAMBIO 2: Ahora usa el estado 'materiasDisponibles' */}
              {materiasDisponibles.map((m) => (
                <label key={m} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    value={m} 
                    checked={asignaturasSelect.includes(m)} 
                    onChange={() => handleAsignaturasChange(m)} 
                  />
                  <span>{m}</span>
                </label>
              ))}
            </div>
            
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
            
            <p className="fecha-registro"><b>Fecha de registro:</b> {selectedProfesor.fechaRegistro ? new Date(selectedProfesor.fechaRegistro).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;