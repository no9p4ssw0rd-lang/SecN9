import React from "react";
// Se eliminó 'useContext'
import { useNavigate } from "react-router-dom";

import "./Perfil.css"; // Importa tu archivo de estilos

/**
 * Componente Perfil. Muestra la información del usuario.
 * Ahora recibe 'user', 'logout', y 'getProfileImageUrl' como props,

 */
function Perfil({ user, logout, getProfileImageUrl }) {
  const navigate = useNavigate();

  // Si no se recibe el objeto 'user' (es null o undefined), redirigir a login.
  // Esto simula la protección de la ruta.
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleEdit = () => navigate("/editar-perfil");
  
  // Usamos una función de logout simulada si no se proporciona, para evitar errores
  const handleLogout = logout || (() => { console.log("Logout simulado."); navigate('/'); });

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <h2>Perfil de Usuario</h2>
        <img 
          src={getProfileImageUrl ? getProfileImageUrl(user.foto) : 'https://placehold.co/100x100/38a169/ffffff?text=Perfil'} 
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
          {/* Llama a la función logout proporcionada por props */}
          <button className="btn-logout" onClick={handleLogout}>CERRAR SESIÓN</button>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
