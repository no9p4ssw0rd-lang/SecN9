import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

// Componentes

import Home from "./Home";
import Login from "./PAGINA/Login";
import RegisterProfesor from "./PAGINA/RegisterProfesor";
import Perfil from "./PAGINA/Perfil";
import EditarPerfil from "./PAGINA/EditarPerfil";
import Password from "./PAGINA/Password";
import Horario from "./PAGINA/Horario";
import Grupo from "./PAGINA/Grupo";
import Trabajos from "./PAGINA/Trabajos";
import Calificaciones from "./PAGINA/Calificaciones";

// Estilos y logo
import "./App.css";
import logo from "./logo.png";


// hemos simulado un estado de usuario simple y eliminado la lógica
// de PrivateRoute y el componente AppWrapper.

// Simulamos que el usuario NO está logueado para que las rutas sean públicas
// y no muestren contenido restringido, ya que la autenticación se eliminó.
const mockUser = null; 
// Si quieres simular un rol para probar la navegación:
// const mockUser = { role: "admin", foto: "default.png" }; 
// const mockUser = { role: "profesor", foto: "default.png" }; 


// Función de utilidad simulada (originalmente venía del Contexto)
const mockGetProfileImageUrl = (foto) => {
    // Si la foto es un path (e.g., 'avatar.jpg'), devolvemos una URL completa
    if (foto) {
        // Usamos una imagen de placeholder si la autenticación ya no funciona
        return `https://placehold.co/100x100/38a169/ffffff?text=${foto.substring(0,1).toUpperCase()}`;
    }
    // URL por defecto si no hay foto
    return "http://localhost:5000/uploads/fotos/default.png";
};


function App() {
  // Ahora usamos el mockUser y la función de utilidad directamente
  const user = mockUser;
  const getProfileImageUrl = mockGetProfileImageUrl;
  
  const navigate = useNavigate();
  const location = useLocation();

 
  
  const handleNavClick = (e, id) => {
    e?.preventDefault();
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      const section = document.getElementById(id);
      if (section) {
        window.scrollTo({ top: section.offsetTop - 70, behavior: "smooth" });
      }
    }
  };

  // Función para renderizar el menú de navegación dinámicamente
  const renderMenu = () => {
    const baseSections = [{ id: "home", label: "INICIO", clickable: true }];
    let roleSections = [];

    // NOTA: La lógica de roles sigue usando 'user.role', pero 'user' es mockUser (null)
    // por lo que estas secciones no se renderizarán a menos que mockUser se cambie.

    if (user?.role === "profesor") {
      roleSections = [
        { id: "trabajos", label: "TRABAJOS", path: "/trabajos" },
        { id: "grupo", label: "ASISTENCIA", path: "/grupo" },
        { id: "horario", label: "HORARIO GENERAL", path: "/horario" },
      ];
    } else if (user?.role === "admin") {
      roleSections = [
        { id: "grupo", label: "GRUPOS", path: "/grupo" },
        { id: "horario", label: "HORARIO GENERAL", path: "/horario" },
        { id: "calificaciones", label: "CALIFICACIONES", path: "/calificaciones" },
      ];
    }

    const sections = [...baseSections, ...roleSections];

    return (
      <div className="nav-menu-right">
        <ul className="nav-list">
          {sections.map((sec) => (
            <li key={sec.id}>
              <button
                className="nav-button nav-link-button"
                onClick={(e) => sec.path ? navigate(sec.path) : handleNavClick(e, sec.id)}
              >
                {sec.label}
              </button>
            </li>
          ))}

          {user?.role === "admin" && (
            <li>
              <button className="nav-button nav-link-button" onClick={() => navigate("/register-profesor")}>
                REGISTRAR PROFESOR
              </button>
            </li>
          )}

          {!user && (
            <li>
              <button className="nav-button nav-link-button" onClick={() => navigate("/login")}>
                INICIAR SESIÓN
              </button>
            </li>
          )}

          {user && (
            <li className="nav-profile">
              <img
                src={getProfileImageUrl(user.foto)}
                alt="Perfil"
                className="profile-img-small"
                onClick={() => navigate("/perfil")}
                style={{ cursor: "pointer" }}
              />
            </li>
          )}
        </ul>
      </div>
    );
  };

  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo);
      if (section) {
        window.scrollTo({ top: section.offsetTop - 70, behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <div>
      <header className="header" id="header">
        <nav className="nav container">
          <a href="#home" className="nav-logo" onClick={(e) => handleNavClick(e, "home")}>
            <img src={logo} alt="logo" className="nav-logo-img" style={{ height: "120px" }} />
          </a>
          <div className="nav-menu" id="nav-menu">
            {renderMenu()}
          </div>
        </nav>
      </header>

      <main>
        <Routes>
          {/* Rutas Públicas */}
          {/* Se pasa 'user' para simular el estado de logueo */}
          <Route path="/" element={<Home user={user} />} /> 
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <Password />} />
          <Route path="/no-autorizado" element={<div>No tienes permiso para ver esta página.</div>} />

          {/* Rutas anteriormente privadas: Se eliminó <PrivateRoute> y 
            se dejaron como rutas públicas para evitar errores de importación. 
            Ahora se puede acceder a estas rutas sin iniciar sesión (con user=null).
          */}
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/editar-perfil" element={<EditarPerfil />} />
          <Route path="/horario" element={<Horario />} />
          <Route path="/trabajos" element={<Trabajos />} />
          <Route path="/grupo" element={<Grupo />} />
          <Route path="/register-profesor" element={<RegisterProfesor />} />
          <Route path="/calificaciones" element={<Calificaciones />} />

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

// Se eliminó el AppWrapper y el AuthProvider ya que dependían del Contexto
export default App;
