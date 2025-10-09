import React, { useEffect, useState } from "react";
import axios from "axios";

// La URL de tu backend ahora se leerá desde las variables de entorno
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Home({ user }) {
  const [profesores, setProfesores] = useState([]);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [asignaturasSelect, setAsignaturasSelect] = useState([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const materias = [
    "MATEMATICAS COOR.ACADEMICA", "TUTORIA", "ESPAÑOL", "INGLES TUTORIA", "INGLES",
    "MATEMATICAS", "CIENCIAS I", "CIENCIAS II", "CIENCIAS III", "ELECTRONICA",
    "INDUSTRIA DEL VESTIDO", "DISEÑO ARQUIT.", "INFORMATICA", "GEOGRAFIA-HISTORIA TUTORIA",
    "HISTORIA", "F.CIVICA y ETICA", "F.CIVICA y ETICA-A.C", "F.CIVICA y ETICA-A.C TUTORIA",
    "ARTES(MUSICA)", "EDUCACION FISICA",
  ];

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 3000);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchProfesores();
    }
  }, [user]);

  const fetchProfesores = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
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
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProfesor(null);
    setConfirmDeleteVisible(false);
  };

  // Lógica actualizada para las imágenes de Cloudinary
  const profileImgUrl = (foto) => {
    if (foto && foto.startsWith("http")) {
      return foto; // Si es una URL completa de Cloudinary, la usa
    }
    // Si no hay foto, devuelve una imagen genérica
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

  const primerNombre = user?.nombre ? user.nombre.split(" ")[0] : "";
  
  return (
    <>
      <style>{`
        /* Estilos generales y de la sección Home */
        .home.section { padding: 4rem 0 2rem; }
        .home-container { text-align: center; }
        .home-title { font-size: 2.5rem; margin-bottom: 1rem; }
        .home-title span { color: #d4af37; } /* Dorado */
        .user-name-gold { font-weight: bold; }

        /* Estilos para la tabla de profesores */
        .profesores.section { padding: 2rem 1rem; }
        .section-title { text-align: center; font-size: 2rem; margin-bottom: 2rem; }
        .profesores-table-container { overflow-x: auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .profesores-table { width: 100%; border-collapse: collapse; }
        .profesores-table th, .profesores-table td { padding: 12px 15px; border-bottom: 1px solid #ddd; text-align: left; }
        .profesores-table th { background-color: #f4f4f4; }
        .profesores-table tbody tr:hover { background-color: #f9f9f9; }
        .btn-ver-perfil { background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; }
        .btn-ver-perfil:hover { background-color: #0056b3; }

        /* Estilos para el Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: #fff; padding: 25px; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; position: relative; }
        .modal-close { position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 1.8rem; cursor: pointer; }
        .profile-img-modal { display: block; width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin: 0 auto 15px; }
        .modal-content h3 { text-align: center; margin-bottom: 15px; }
        .profesor-details p { margin: 5px 0; }
        .asignaturas-title { margin-top: 20px; font-weight: bold; }
        .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 10px; }
        .checkbox-label { display: flex; align-items: center; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .btn-guardar { background-color: #28a745; }
        .btn-eliminar { background-color: #dc3545; }

        /* Mini alerta de confirmación */
        .mini-alert { margin-top: 15px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px; text-align: center; }
        .mini-alert-buttons { margin-top: 10px; display: flex; justify-content: center; gap: 10px; }

        /* Alerta de notificación general */
        .alerta-fixed { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 2000; padding: 10px 20px; border-radius: 5px; color: #fff; }
        .alerta-fixed.success { background-color: #28a745; }
        .alerta-fixed.error { background-color: #dc3545; }
      `}</style>

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
          </div>
        </div>
      </section>
      
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

      {modalVisible && selectedProfesor && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <img src={profileImgUrl(selectedProfesor.foto)} alt={selectedProfesor.nombre} className="profile-img-modal" />
            <h3>{selectedProfesor.nombre}</h3>
            
            <div className="profesor-details">
              <p><b>Correo:</b> {selectedProfesor.email}</p>
              <p><b>Celular:</b> {selectedProfesor.celular}</p>
            </div>

            <p className="asignaturas-title"><b>Asignaturas:</b></p>
            <div className="checkbox-group">
              {materias.map((m) => (
                <label key={m} className="checkbox-label">
                  <input type="checkbox" value={m} checked={asignaturasSelect.includes(m)} onChange={() => handleAsignaturasChange(m)} />
                  <span>{m}</span>
                </label>
              ))}
            </div>
            
            <div className="modal-actions">
              <button className="btn-guardar" onClick={guardarAsignaturas}>Guardar</button>
              {!confirmDeleteVisible && <button className="btn-eliminar" onClick={() => setConfirmDeleteVisible(true)}>Eliminar</button>}
            </div>

            {confirmDeleteVisible && (
              <div className="mini-alert">
                <p>¿Seguro que deseas eliminar a {selectedProfesor.nombre}?</p>
                <div className="mini-alert-buttons">
                  <button onClick={confirmDelete}>Sí, Eliminar</button>
                  <button onClick={() => setConfirmDeleteVisible(false)}>No</button>
                </div>
              </div>
            )}
            <p><b>Fecha de registro:</b> {selectedProfesor.fechaRegistro ? new Date(selectedProfesor.fechaRegistro).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
