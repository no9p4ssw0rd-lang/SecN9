import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext"; // Importa el contexto de autenticación
import "./Perfil.css"; // Importa tu archivo de estilos

function Perfil() {
  // Obtiene los datos y funciones del contexto, en lugar de recibirlos por props
  const { user, logout, getProfileImageUrl } = useContext(AuthContext);
  const navigate = useNavigate();

  // Si no hay usuario, PrivateRoute ya debería haber redirigido,
  // pero esta es una capa extra de seguridad.
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleEdit = () => navigate("/editar-perfil");

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <h2>Perfil de Usuario</h2>
        <img 
          src={getProfileImageUrl(user.foto)} 
          alt="Perfil" 
          className="profile-img-large" 
        />

        <div className="perfil-info">
          <p><strong>Nombre:</strong> {user.nombre || "N/A"}</p>
          <p><strong>Edad:</strong> {user.edad || "N/A"}</p>
          <p><strong>Email:</strong> {user.email || "N/A"}</p>
          <p><strong>Sexo:</strong> {user.sexo || "N/A"}</p>
          <p><strong>Celular:</strong> {user.celular || "N/A"}</p>
          <p><strong>Rol:</strong> {user.role || "N/A"}</p>
        </div>

        <div className="perfil-buttons">
          <button className="btn-edit" onClick={handleEdit}>EDITAR PERFIL</button>
          {/* Llama a la función logout del contexto al hacer clic */}
          <button className="btn-logout" onClick={logout}>CERRAR SESIÓN</button>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
