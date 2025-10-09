import React, { useEffect, useContext } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

// Componentes y Contexto (Asegúrate de que AuthContext.js y PrivateRoute.js estén en la carpeta PAGINA/)
// Se ajustan las extensiones a .js
import { AuthProvider, AuthContext } from "./PAGINA/AuthContext.js"; 
import PrivateRoute from "./PAGINA/PrivateRoute.js"; 

// Componentes de Páginas
// Se ajustan las extensiones a .js
import Home from "./PAGINA/Home.js"; 
import Login from "./PAGINA/Login.js";
import RegisterProfesor from "./PAGINA/RegisterProfesor.js";
import Perfil from "./PAGINA/Perfil.js";
import EditarPerfil from "./PAGINA/EditarPerfil.js";
import Password from "./PAGINA/Password.js"; // Usado para restablecer contraseña
import Horario from "./PAGINA/Horario.js";
import Grupo from "./PAGINA/Grupo.js";
import Trabajos from "./PAGINA/Trabajos.js";
import Calificaciones from "./PAGINA/Calificaciones.js";

// Estilos y logo (Asegúrate de que Home.css esté en PAGINA/ y logo.png en src/)
import "./PAGINA/Home.css"; 
import logo from "./logo.png"; 

/**
 * Componente principal de la aplicación.
 * Utiliza el AuthContext para gestionar el estado del usuario.
 */
function App() {
    // Obtenemos el estado y las funciones del Contexto de Autenticación
    // Se elimina getProfileImageUrl del contexto ya que la lógica se maneja aquí
    const { user, loading, logout } = useContext(AuthContext); 
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Lógica para determinar la fuente de la imagen de perfil.
     * Utiliza la URL completa de Cloudinary si está disponible, o un placeholder.
     * @param {string} foto - La URL de la foto almacenada en el objeto de usuario.
     * @returns {string} La URL final de la imagen.
     */
    const getProfileImageSrc = (foto) => {
        // 1. Verifica si 'foto' existe, es una cadena y comienza con 'http' (Cloudinary URL)
        if (foto && typeof foto === 'string' && foto.startsWith("http")) {
            return foto; 
        }
        // 2. Si no es válida o no existe, devuelve una imagen genérica (placeholder 50x50)
        return `https://placehold.co/50x50/34495e/ffffff?text=PF`; 
    };

    // Hook para manejar el scroll a secciones específicas después de la navegación
    useEffect(() => {
        if (location.state?.scrollTo) {
            const section = document.getElementById(location.state.scrollTo);
            if (section) {
                // Se ajusta el scroll para dejar espacio al header fijo (70px)
                window.scrollTo({ top: section.offsetTop - 70, behavior: "smooth" });
            }
        }
    }, [location]);

    // Muestra un loader mientras se verifica la sesión inicial
    if (loading) {
        return (
            <div className="loading-screen flex items-center justify-center h-screen bg-gray-50 text-xl text-gray-700">
                Cargando la sesión...
            </div>
        );
    }

    // Función para manejar la navegación a secciones de la página de inicio o a otras rutas
    const handleNavClick = (e, id) => {
        e?.preventDefault();
        // Si no estamos en la página de inicio, navegamos a Home con el estado de scroll
        if (location.pathname !== "/") {
            navigate("/", { state: { scrollTo: id } });
        } else {
            // Si ya estamos en Home, simplemente hacemos scroll
            const section = document.getElementById(id);
            if (section) {
                window.scrollTo({ top: section.offsetTop - 70, behavior: "smooth" });
            }
        }
    };

    // Función para renderizar el menú de navegación dinámicamente según el rol
    const renderMenu = () => {
        const baseSections = [{ id: "home", label: "INICIO" }];
        let roleSections = [];

        if (user?.role === "profesor") {
            // Menú para Profesores
            roleSections = [
                { id: "trabajos", label: "TRABAJOS", path: "/trabajos" },
                { id: "grupo", label: "ASISTENCIA", path: "/grupo" },
            ];
        } else if (user?.role === "admin") {
            // Menú para Administradores
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

                    {/* Opción solo para Administradores */}
                    {user?.role === "admin" && (
                        <li>
                            <button className="nav-button nav-link-button" onClick={() => navigate("/register-profesor")}>
                                REGISTRAR PROFESOR
                            </button>
                        </li>
                    )}

                    {/* Mostrar INICIAR SESIÓN o Imagen de Perfil/Logout */}
                    {!user ? (
                        <li>
                            <button className="nav-button nav-link-button" onClick={() => navigate("/login")}>
                                INICIAR SESIÓN
                            </button>
                        </li>
                    ) : (
                        <>
                            {/* Imagen de perfil que navega a /perfil */}
                            <li className="nav-profile">
                                <img
                                    // *** USO DE LA FUNCIÓN LOCAL ***
                                    src={getProfileImageSrc(user.foto)} 
                                    alt="Perfil"
                                    className="profile-img-small"
                                    onClick={() => navigate("/perfil")}
                                    style={{ cursor: "pointer" }}
                                />
                            </li>
                            {/* Botón de cerrar sesión */}
                            <li>
                                <button className="nav-button nav-link-button" onClick={logout}>
                                    SALIR
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
            {/* Header y Navigación */}
            <header className="header" id="header">
                <nav className="nav container">
                    {/* Logo que navega al inicio */}
                    <a href="#home" className="nav-logo" onClick={(e) => handleNavClick(e, "home")}>
                        <img src={logo} alt="logo" className="nav-logo-img" style={{ height: "120px" }} />
                    </a>
                    <div className="nav-menu" id="nav-menu">
                        {renderMenu()}
                    </div>
                </nav>
            </header>

            {/* Contenido principal y Rutas */}
            <main>
                <Routes>
                    {/* Rutas Públicas */}
                    <Route path="/" element={<Home user={user} />} />
                    {/* Si el usuario está logueado, redirige a Home */}
                    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                    <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <Password />} />
                    <Route path="/no-autorizado" element={<div>No tienes permiso para ver esta página.</div>} />

                    {/* Rutas Protegidas (Requieren autenticación) */}
                    <Route 
                        path="/perfil" 
                        element={
                            <PrivateRoute>
                                {/* Pasamos la función local como prop para que Perfil pueda mostrar la imagen */}
                                <Perfil user={user} logout={logout} getProfileImageUrl={getProfileImageSrc} />
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/editar-perfil" element={<PrivateRoute><EditarPerfil user={user} /></PrivateRoute>} />
                    
                    {/* Rutas con Rol Específico (Usan el componente PrivateRoute con requiredRole) */}
                    
                    {/* Ruta para Admin y Profesor */}
                    <Route path="/horario" element={<PrivateRoute requiredRole={["admin", "profesor"]}><Horario user={user} /></PrivateRoute>} />
                    <Route path="/grupo" element={<PrivateRoute requiredRole={["admin", "profesor"]}><Grupo user={user} /></PrivateRoute>} />

                    {/* Rutas solo para profesores */}
                    <Route path="/trabajos" element={<PrivateRoute requiredRole="profesor"><Trabajos user={user} /></PrivateRoute>} />
                    
                    {/* Rutas solo para admin */}
                    <Route path="/register-profesor" element={<PrivateRoute requiredRole="admin"><RegisterProfesor user={user} /></PrivateRoute>} />
                    <Route path="/calificaciones" element={<PrivateRoute requiredRole="admin"><Calificaciones user={user} /></PrivateRoute>} />

                    {/* Redirección para rutas no encontradas (404) */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

/**
 * Wrapper que envuelve el componente App en el AuthProvider.
 * ESTO ES CRÍTICO para que el useContext(AuthContext) funcione dentro de App.
 */
const AppWrapper = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWrapper;
