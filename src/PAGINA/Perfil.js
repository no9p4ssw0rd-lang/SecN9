import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Necesario si logout hace una llamada a la API
import "./Perfil.css";

/**
 * Componente Perfil. Muestra la información del usuario.
 * Recibe 'user', 'logout', y 'getProfileImageUrl' como props.
 */
function Perfil({ user, logout, getProfileImageUrl }) {
  const navigate = useNavigate();

  // Si no se recibe el objeto 'user' (es null o undefined), redirigir a login.
  if (!user) {
    // Si no hay usuario, redirigimos inmediatamente (simula protección de ruta)
    setTimeout(() => navigate('/login'), 0); 
    return null;
  }

  const handleEdit = () => navigate("/editar-perfil");
  
  // Usamos la función de logout proporcionada o una función segura por defecto
  const handleLogout = logout || (() => { 
      console.log("Logout simulado."); 
      localStorage.removeItem("token");
      navigate('/'); 
  });

  // Determina la URL de la foto. Si getProfileImageUrl existe, la usa.
  // Si no, usa el valor de user.foto para intentar mostrar la imagen, o un placeholder.
  const profileSrc = getProfileImageUrl 
    ? getProfileImageUrl(user.foto) 
    : user.foto || 'https://placehold.co/100x100/38a169/ffffff?text=H';


  return (
    <div className="perfil-page">
      {/* Estilos asumidos para Perfil.css - deben ser provistos por el usuario en su archivo */}
     
      <div className="perfil-container">
        <h2>Perfil de Usuario</h2>
        <img 
          src={profileSrc} 
          alt="Perfil" 
          className="profile-img-large" 
          // Si la imagen falla (es inválida o no existe), mostramos un avatar por defecto
          onError={(e) => {
              e.target.onerror = null; // Evitar loop infinito
              // Muestra la inicial del nombre o un placeholder genérico
              const initial = user.nombre ? user.nombre.charAt(0).toUpperCase() : 'H';
              e.target.src = `https://placehold.co/120x120/38a169/ffffff?text=${initial}`;
          }}
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
          <button className="btn-logout" onClick={handleLogout}>CERRAR SESIÓN</button>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
