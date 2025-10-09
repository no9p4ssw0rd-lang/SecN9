import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
// Importamos el AuthContext para acceder al token
import { AuthContext } from "../PAGINA/AuthContext.jsx"; 

// La URL de tu backend ahora se lee desde las variables de entorno
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * Componente principal de la página de inicio.
 * Muestra un saludo y, si el usuario es 'admin', gestiona la lista de profesores.
 */
function Home({ user }) {
    // Obtenemos el token de autenticación del contexto
    // NOTA: Asumimos que AuthContext proporciona el 'token' de forma segura.
    const { token } = useContext(AuthContext); 
    
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

    /** Muestra una alerta temporal en la parte superior. */
    const mostrarAlerta = (mensaje, tipo = "success") => {
        setAlerta({ mensaje, tipo });
        setTimeout(() => setAlerta(null), 3000);
    };

    /** Efecto para cargar profesores solo si el usuario es admin y tiene un token. */
    useEffect(() => {
        if (user?.role === "admin" && token) {
            fetchProfesores();
        }
    }, [user, token]); // Depende de user y token

    /** Obtiene la lista de profesores del backend. */
    const fetchProfesores = () => {
        // Usamos el token del contexto
        if (!token) return console.error("⚠️ Token no disponible."); 
        
        axios.get(`${API_URL}/auth/profesores`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => setProfesores(res.data || []))
            .catch((err) => {
                console.error("Error al obtener profesores:", err);
                mostrarAlerta("No se pudieron cargar los profesores.", "error");
            });
    };

    /** Abre el modal de edición/visualización del perfil del profesor. */
    const openModal = (profesor) => {
        setSelectedProfesor(profesor);
        setAsignaturasSelect(profesor.asignaturas || []);
        setModalVisible(true);
        setConfirmDeleteVisible(false); // Reinicia la confirmación de borrado
    };

    /** Cierra el modal y limpia el estado. */
    const closeModal = () => {
        setModalVisible(false);
        setSelectedProfesor(null);
        setConfirmDeleteVisible(false);
    };

    /** * Genera la URL de la imagen de perfil, priorizando Cloudinary/URL completas.
     * Si no hay foto, usa un placeholder. 
     */
    const profileImgUrl = (foto) => {
        if (foto && foto.startsWith("http")) {
            return foto; // URL completa (Cloudinary, etc.)
        }
        // Placeholder genérico para cuando no hay foto o la URL es local/inválida
        return `https://placehold.co/150x150/EFEFEF/AAAAAA&text=Sin+Foto`;
    };

    /** Maneja la selección/deselección de asignaturas en el modal. */
    const handleAsignaturasChange = (materia) => {
        setAsignaturasSelect((prev) =>
            prev.includes(materia) ? prev.filter((m) => m !== materia) : [...prev, materia]
        );
    };

    /** Guarda las asignaturas modificadas para el profesor seleccionado. */
    const guardarAsignaturas = () => {
        if (!selectedProfesor || !token) return; // Usamos token del contexto
        
        axios.put(`${API_URL}/auth/profesores/${selectedProfesor._id}/asignaturas`, 
                { asignaturas: asignaturasSelect }, 
                { headers: { Authorization: `Bearer ${token}` } })
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
    
    /** Confirma y ejecuta la eliminación del profesor. */
    const confirmDelete = () => {
        if (!selectedProfesor || !token) return; // Usamos token del contexto
        
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
                .section-title { text-align: center; font-size: 2rem; margin-bottom: 2rem; color: #333; }
                .profesores-table-container { overflow-x: auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 0 auto; max-width: 1000px; }
                .profesores-table { width: 100%; border-collapse: collapse; }
                .profesores-table th, .profesores-table td { padding: 12px 15px; border-bottom: 1px solid #eee; text-align: left; }
                .profesores-table th { background-color: #f4f4f4; color: #555; }
                .profesores-table tbody tr:hover { background-color: #f9f9f9; }
                .btn-ver-perfil { background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; }
                .btn-ver-perfil:hover { background-color: #0056b3; }

                /* Estilos para el Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background: #fff; padding: 25px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
                .modal-close { position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 2rem; color: #333; cursor: pointer; transition: color 0.2s; }
                .modal-close:hover { color: #dc3545; }
                .profile-img-modal { display: block; width: 120px; height: 120px; border: 4px solid #f0f0f0; border-radius: 50%; object-fit: cover; margin: 0 auto 20px; }
                .modal-content h3 { text-align: center; margin-bottom: 15px; font-size: 1.5rem; color: #333; }
                .profesor-details p { margin: 8px 0; font-size: 0.95rem; }
                .asignaturas-title { margin-top: 20px; font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 15px; padding-bottom: 15px; }
                .checkbox-label { display: flex; align-items: center; cursor: pointer; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .modal-actions button { padding: 10px 15px; border-radius: 5px; color: white; border: none; cursor: pointer; transition: opacity 0.3s; }
                .modal-actions button:hover { opacity: 0.9; }
                .btn-guardar { background-color: #28a745; }
                .btn-eliminar { background-color: #dc3545; }

                /* Mini alerta de confirmación (Modal anidado) */
                .mini-alert { margin-top: 15px; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; text-align: center; color: #721c24; }
                .mini-alert-buttons { margin-top: 10px; display: flex; justify-content: center; gap: 15px; }
                .mini-alert-buttons button { padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; }
                .mini-alert-buttons button:first-child { background-color: #dc3545; color: white; }
                .mini-alert-buttons button:last-child { background-color: #f0f0f0; color: #333; }

                /* Alerta de notificación general */
                .alerta-fixed { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 2000; padding: 12px 25px; border-radius: 8px; color: #fff; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .alerta-fixed.success { background-color: #28a745; }
                .alerta-fixed.error { background-color: #dc3545; }
            `}</style>

            {alerta && <div className={`alerta-fixed ${alerta.tipo}`}>{alerta.mensaje}</div>}

            {/* Sección de Bienvenida */}
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
            
            {/* Sección de Profesores (Solo para Admin) */}
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

            {/* Modal de Detalle/Edición de Profesor */}
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
                            {/* Muestra el botón Eliminar solo si no se ha pedido la confirmación */}
                            {!confirmDeleteVisible && <button className="btn-eliminar" onClick={() => setConfirmDeleteVisible(true)}>Eliminar</button>}
                        </div>

                        {/* Diálogo de Confirmación de Eliminación */}
                        {confirmDeleteVisible && (
                            <div className="mini-alert">
                                <p>¿Seguro que deseas eliminar a **{selectedProfesor.nombre}**?</p>
                                <div className="mini-alert-buttons">
                                    <button onClick={confirmDelete}>Sí, Eliminar</button>
                                    <button onClick={() => setConfirmDeleteVisible(false)}>No</button>
                                </div>
                            </div>
                        )}
                        <p style={{ marginTop: '15px', fontSize: '0.9rem' }}>
                            <b>Fecha de registro:</b> {selectedProfesor.fechaRegistro ? new Date(selectedProfesor.fechaRegistro).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

export default Home;
