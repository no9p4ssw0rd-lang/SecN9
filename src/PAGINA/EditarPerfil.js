import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditarPerfil.css";

// --- CAMBIO: URL de la API desde variables de entorno para Vercel ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Función auxiliar para construir la URL de la foto (reutilizada de Perfil.jsx)
const resolvePhotoUrl = (user, API_URL) => {
    // Si no hay usuario o no hay campo de foto, devuelve el placeholder
    if (!user || !user.foto) return "https://placehold.co/120x120/f9f9f9/38a169?text=H";

    const foto = user.foto;
    
    // 1. Si es una URL completa (Cloudinary), la usamos
    if (foto.startsWith("http")) {
        return foto;
    }
    // 2. Si es una ruta relativa (backend local/Render), la construimos
    if (foto.startsWith("/")) {
        return `${API_URL}${foto}`;
    }
    // 3. Caso general:
    return `${API_URL}/${foto}`;
};


function EditarPerfil({ user, setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    email: "",
    sexo: "Masculino",
    celular: "",
  });

  const [foto, setFoto] = useState(null); // Archivo de foto a subir
  const [fotoPreview, setFotoPreview] = useState("https://placehold.co/120x120/f9f9f9/38a169?text=H"); // URL para mostrar la imagen
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && (user._id || user.id)) { // Esperamos a que el usuario tenga un ID
      setFormData({
        nombre: user.nombre || "",
        edad: user.edad || "",
        email: user.email || "",
        sexo: user.sexo || "Masculino",
        celular: user.celular || "",
      });

      // --- CORRECCIÓN: Resolver la URL de la foto actual ---
      setFotoPreview(resolvePhotoUrl(user, API_URL));
      
    } else if (!user) {
        // En caso de que se acceda a la ruta sin usuario, redirigimos
        setTimeout(() => navigate('/login'), 0);
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      // Previsualización de la nueva imagen
      setFotoPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // FIX PRINCIPAL: Usar el ID que esté disponible (_id o id)
    const userId = user?._id || user?.id;

    if (!user || !userId) {
      setLoading(false);
      return setError("Error: ID de usuario no encontrado. Por favor, inicia sesión de nuevo.");
    }
    
    const { nombre, edad, email, celular } = formData;

    if (!nombre || !edad || !email || !celular) return setError("Todos los campos son obligatorios.");
    if (Number(edad) <= 0) return setError("La edad ingresada no es válida.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("El correo electrónico ingresado no es válido.");
    if (!/^\d+$/.test(celular)) return setError("El número de celular debe contener solo dígitos.");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return setError("No estás autenticado. Por favor, inicia sesión nuevamente.");

      const data = new FormData();
      // Agregar datos del formulario
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      
      // Agregar el archivo de foto si ha sido seleccionado
      if (foto) data.append("foto", foto); 

      // --- CORRECCIÓN: Petición PUT a la API con FormData, usando el ID dinámico ---
      const res = await axios.put(`${API_URL}/profesores/editar-perfil/${userId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = res.data.user || res.data;
      
      // Actualizar el estado global del usuario y localStorage
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSuccess("Perfil actualizado correctamente.");
      
      // Limpiar el archivo de foto para evitar re-subidas accidentales
      setFoto(null); 

      setTimeout(() => navigate("/perfil"), 1500);
    } catch (err) {
      console.error("Error al actualizar:", err.response?.data?.msg || err);
      const backendMsg = err.response?.data?.msg || "";
      if (backendMsg.includes("Email already in use")) {
        setError("El correo ingresado ya está registrado. Por favor, utiliza otro.");
      } else if (backendMsg.includes("Celular already in use")) {
        setError("El número de celular ya está registrado. Por favor, utiliza otro.");
      } else {
        setError("Error al actualizar perfil. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editar-perfil-page">
      {/* Estilos asumidos para EditarPerfil.css */}
     

      <div className="editar-perfil-card">
        <h2>Editar Perfil</h2>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <img src={fotoPreview} alt="Preview" className="profile-img-large" 
            onError={(e) => {
                e.target.onerror = null;
                const initial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'H';
                e.target.src = `https://placehold.co/120x120/f9f9f9/38a169?text=${initial}`;
            }}
        />

        <div style={{ marginBottom: "15px" }}>
          <label className="btn-edit" style={{ marginRight: "10px", cursor: "pointer" }}>
            Cambiar Foto
            <input type="file" onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" />
          <input type="number" name="edad" value={formData.edad} onChange={handleChange} placeholder="Edad" />
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
          <select name="sexo" value={formData.sexo} onChange={handleChange}>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
          <input type="text" name="celular" value={formData.celular} onChange={handleChange} placeholder="Celular" />

          <div className="editar-perfil-buttons">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate("/perfil")}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarPerfil;
