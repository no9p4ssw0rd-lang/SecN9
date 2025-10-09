import React, { useEffect, useContext } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

// Componentes y Contexto
// RUTA CORREGIDA: Apunta a la subcarpeta PAGINA/
import { AuthProvider, AuthContext } from "./PAGINA/AuthContext"; 
import PrivateRoute from "./PAGINA/PrivateRoute"; 

import Home from "./PAGINA/Home"; // Asumimos que todos los componentes están en PAGINA
import Login from "./PAGINA/Login";
import RegisterProfesor from "./PAGINA/RegisterProfesor";
import Perfil from "./PAGINA/Perfil";
import EditarPerfil from "./PAGINA/EditarPerfil";
import Password from "./PAGINA/Password";
import Horario from "./PAGINA/Horario";
import Grupo from "./PAGINA/Grupo";
import Trabajos from "./PAGINA/Trabajos";
import Calificaciones from "./PAGINA/Calificaciones";

// Estilos y logo (asumiendo que están en la raíz src/)
import "./App.css"; 
import logo from "./logo.png"; 


function App() {
  // Obtenemos el estado y las funciones del Contexto de Autenticación
  const { user, loading, getProfileImageUrl, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Se llama al Hook useEffect ANTES del return condicional para evitar el error de Hooks.
  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo);
      if (section) {
        window.scrollTo({ top: section.offsetTop - 70, behavior: "smooth" });
      }
    }
  }, [location]);

  // Muestra un loader mientras se verifica si el usuario está logueado
  if (loading) {
    return <div className="loading-screen">Cargando la sesión...</div>;
  }

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

          {!user ? (
            <li>
              <button className="nav-button nav-link-button" onClick={() => navigate("/login")}>
                INICIAR SESIÓN
              </button>
            </li>
          ) : (
                <>
                    {/* Elemento de la imagen de perfil (clic dirige al perfil) */}
                    <li className="nav-profile">
                        <img
                            src={getProfileImageUrl(user.foto)}
                            alt="Perfil"
                            className="profile-img-small"
                            onClick={() => navigate("/perfil")}
                            style={{ cursor: "pointer" }}
                        />
                    </li>
                    {/* Botón de CERRAR SESIÓN como un elemento de menú aparte */}
                    <li>
                        <button className="nav-button nav-link-button" onClick={logout}>
                            CERRAR SESIÓN
                        </button>
                    </li>
                </>
          )}
        </ul>
      </div>
    );
  };

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
          <Route path="/" element={<Home user={user} />} />
          {/* Solo permite el login si no hay usuario */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <Password />} />
          <Route path="/no-autorizado" element={<div>No tienes permiso para ver esta página.</div>} />

          {/* Rutas Privadas (protegidas por PrivateRoute) */}
          <Route path="/perfil" element={<PrivateRoute><Perfil user={user} logout={logout} getProfileImageUrl={getProfileImageUrl} /></PrivateRoute>} />
          <Route path="/editar-perfil" element={<PrivateRoute><EditarPerfil user={user} /></PrivateRoute>} />
          <Route path="/horario" element={<PrivateRoute><Horario user={user} /></PrivateRoute>} />
          
          {/* Rutas solo para profesores */}
          <Route path="/trabajos" element={<PrivateRoute requiredRole="profesor"><Trabajos user={user} /></PrivateRoute>} />
          
          {/* Rutas para admin y profesor */}
          <Route path="/grupo" element={<PrivateRoute requiredRole={["admin", "profesor"]}><Grupo user={user} /></PrivateRoute>} />

          {/* Rutas solo para admin */}
          <Route path="/register-profesor" element={<PrivateRoute requiredRole="admin"><RegisterProfesor user={user} /></PrivateRoute>} />
          <Route path="/calificaciones" element={<PrivateRoute requiredRole="admin"><Calificaciones user={user} /></PrivateRoute>} />

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

// Wrapper para usar el AuthProvider
const AppWrapper = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWrapper;
