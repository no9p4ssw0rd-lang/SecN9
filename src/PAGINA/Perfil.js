import React from "react";
import { useNavigate } from "react-router-dom";

import "./Perfil.css"; // Importa tu archivo de estilos

/**
 * Componente Perfil. Muestra la información del usuario.
 * Recibe 'user', 'logout', y 'getProfileImageUrl' como props desde App.js.
 */
function Perfil({ user, logout, getProfileImageUrl }) {
	const navigate = useNavigate();

	// Si no se recibe el objeto 'user' (es null o undefined), redirigir a login.
	if (!user) {
		navigate('/login');
		return null;
	}

	const handleEdit = () => navigate("/editar-perfil");
	
	const handleLogout = logout || (() => { console.log("Logout simulado."); navigate('/'); });

	// Determinar la URL de la imagen
	const imageUrl = getProfileImageUrl 
		? getProfileImageUrl(user.foto) 
		: 'https://placehold.co/150x150/AAAAAA/FFFFFF?text=Perfil';

	return (
		<div className="perfil-page">
			<div className="perfil-container">
				<h2>Perfil de Usuario</h2>
				<img 
					// Usamos la URL determinada arriba.
					src={imageUrl} 
					alt="Perfil" 
					className="profile-img-large" 
					// Agregar un estilo inline de fallback para asegurar dimensiones.
					style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
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
