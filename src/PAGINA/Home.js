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
  const [alerta, setAlerta] = useState(null); // Nuevo estado para alertas

  const materias = [
    "ESPAÑOL I", "ESPAÑOL II", "ESPAÑOL III", "INGLES I", "INGLES II", "INGLES III", "ARTES I", "ARTES II", "ARTES III",
    "MATEMATICAS I", "MATEMATICAS II", "MATEMATICAS III", "BIOLOGIA I", "FISICA II", "QUIMICA III", "GEOGRAFIA I",
    , "HISTORIA I", "HISTORIA II", "HISTORIA III", "FORMACION CIVICA Y ETICA I", "FORMACION CIVICA Y ETICA II", "FORMACION CIVICA Y ETICA III",
    "TECNOLOGIA I", "TECNOLOGIA II", " TECNOLOGIA III", "EDUCACION FISICA I", "EDUCACION FISICA II", "EDUCACION FISICA III", "INTEGRACION CURRICULAR I", "INTEGRACION CURRICULAR II", "INTEGRACION CURRICULAR III"
    , "TUTORIA I", "TUTORIA II", "TUTORIA III",
  ];

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 3000);
  };

  // Se mantiene el useEffect para cargar profesores solo si es admin
  useEffect(() => {
    if (user?.role === "admin") {
      fetchProfesores();
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

  const openModal = (profesor) => {
    setSelectedProfesor(profesor);
    setAsignaturasSelect(profesor.asignaturas || []);
    setModalVisible(true);
    setConfirmDeleteVisible(false); // Asegurar que la confirmación de borrado esté oculta
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
      return foto; // Si es una URL completa (Cloudinary), la usa
    }
    // Si no hay foto, devuelve una imagen genérica. No usamos la ruta localhost antigua.
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
    // Uso de API_URL para compatibilidad con Render/Vercel
    axios.put(`${API_URL}/auth/profesores/${selectedProfesor._id}/asignaturas`, { asignaturas: asignaturasSelect }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        mostrarAlerta("Asignaturas actualizadas.", "success"); // Alerta del código nuevo
        fetchProfesores();
        closeModal();
      })
      .catch((err) => {
        console.error("Error al guardar asignaturas:", err);
        mostrarAlerta("Error al guardar las asignaturas.", "error"); // Alerta del código nuevo
      });
  };

  const handleDeleteClick = () => setConfirmDeleteVisible(true); // Función explícita como en el código viejo

  const confirmDelete = () => {
    if (!selectedProfesor) return;
    const token = localStorage.getItem("token");
    // Uso de API_URL para compatibilidad con Render/Vercel
    axios.delete(`${API_URL}/auth/profesores/${selectedProfesor._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        mostrarAlerta("Profesor eliminado correctamente.", "success"); // Alerta del código nuevo
        fetchProfesores();
        closeModal();
      })
      .catch((err) => {
        console.error("Error al eliminar profesor:", err);
        mostrarAlerta("Error al eliminar el profesor.", "error"); // Alerta del código nuevo
      });
  };

  const cancelDelete = () => setConfirmDeleteVisible(false); // Función explícita como en el código viejo

  const primerNombre = user?.nombre ? user.nombre.split(" ")[0] : "";

  return (
    // Se elimina el div envolvente para usar el React Fragment (el nuevo código lo usaba)
    <>
      {/* El bloque <style> se elimina asumiendo que el CSS está en Home.css */}

      {/* Alerta de notificación general (Funcionalidad SendGrid/Notificaciones) */}
      {alerta && <div className={`alerta-fixed ${alerta.tipo}`}>{alerta.mensaje}</div>}

      {/* HOME (Estructura del código viejo) */}
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
            {/* Texto adicional del código viejo, si el usuario no está logueado */}
            {!user && <p>Por favor inicia sesión para acceder a todas las funciones.</p>}
          </div>
        </div>
      </section>

      {/* SECCIÓN DE NOVEDADES (NUEVO) - Solo visible si NO hay usuario logueado */}
      {!user && (
        <section className="novedades section" id="novedades">
          <h2 className="section-title">Últimas Actualizaciones</h2>
          <div className="novedades-container container">
            <div className="novedad-item">
              <span className="novedad-icon">✨</span>
              <p>Mejora en interfaz de alumnos</p>
            </div>
            <div className="novedad-item">
              <span className="novedad-icon">⚠️</span>
              <p>Nueva función de asistencia justificada</p>
            </div>
            <div className="novedad-item">
              <span className="novedad-icon">🚀</span>
              <p>Optimización de carga de página</p>
            </div>
            <div className="novedad-item">
              <span className="novedad-icon">🎨</span>
              <p>Diseño visual renovado</p>
            </div>
          </div>
        </section>
      )}

      {/* --- */}

      {/* PROFESORES ADMIN (Estructura del código viejo) */}
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

      {/* --- */}

      {/* MODAL PROFESOR (Estructura del código viejo) */}
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
              {/* Campos del código viejo que no estaban en el nuevo, los incluyo */}
              <p><b>Edad:</b> {selectedProfesor.edad}</p>
              <p><b>Sexo:</b> {selectedProfesor.sexo}</p>
            </div>

            <p className="asignaturas-title"><b>Asignaturas:</b></p>
            <div className="checkbox-group">
              {materias.map((m) => (
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
              {/* Botones como en el código viejo, con la función explícita para eliminar */}
              <button className="btn-guardar" onClick={guardarAsignaturas}>Guardar asignaturas</button>
              {!confirmDeleteVisible && <button className="btn-eliminar" onClick={handleDeleteClick}>Eliminar profesor</button>}
            </div>

            {/* Confirmación de eliminación (con la estructura del código viejo) */}
            {confirmDeleteVisible && (
              <div className="mini-alert">
                <p>¿Seguro que deseas eliminar a {selectedProfesor.nombre}?</p>
                <div className="mini-alert-buttons">
                  <button className="mini-alert-yes" onClick={confirmDelete}>Sí, Eliminar</button>
                  <button className="mini-alert-no" onClick={cancelDelete}>No</button>
                </div>
              </div>
            )}

            {/* Fecha de registro con la clase del código viejo (si aplica) */}
            <p className="fecha-registro"><b>Fecha de registro:</b> {selectedProfesor.fechaRegistro ? new Date(selectedProfesor.fechaRegistro).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;