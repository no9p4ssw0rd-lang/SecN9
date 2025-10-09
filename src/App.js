import React, { useEffect, useContext } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

// Componentes y Contexto (Asegúrate de que AuthContext.js y PrivateRoute.js estén en la carpeta PAGINA/)
import { AuthProvider, AuthContext } from "./PAGINA/AuthContext"; 
import PrivateRoute from "./PAGINA/PrivateRoute"; 

// Componentes de Páginas
import Home from "./PAGINA/Home"; 
import Login from "./PAGINA/Login";
import RegisterProfesor from "./PAGINA/RegisterProfesor";
import Perfil from "./PAGINA/Perfil";
import EditarPerfil from "./PAGINA/EditarPerfil";
import Password from "./PAGINA/Password"; // Usado para restablecer contraseña
import Horario from "./PAGINA/Horario";
import Grupo from "./PAGINA/Grupo";
import Trabajos from "./PAGINA/Trabajos";
import Calificaciones from "./PAGINA/Calificaciones";

// Estilos y logo (Asegúrate de que Home.css esté en PAGINA/ y logo.png en src/)
import "./PAGINA/Home.css"; 
import logo from "./logo.png"; 

/**
 * Componente principal de la aplicación.
 * Utiliza el AuthContext para gestionar el estado del usuario.
 */
function App() {
    // Obtenemos el estado y las funciones del Contexto de Autenticación
    // Este hook solo funciona porque App está envuelto en AuthProvider (ver AppWrapper al final)
    const { user, loading, getProfileImageUrl, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

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

    // Muestra un loader mientras se verifica la sesión inicial (especialmente útil para Firebase/Auth)
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
                                    // Usamos getProfileImageUrl de AuthContext que debe manejar la URL de Cloudinary/servidor
                                    src={getProfileImageUrl(user.foto)} 
                                    alt="Perfil"
                                    className="profile-img-small"
                                    onClick={() => navigate("/perfil")}
                                    style={{ cursor: "pointer" }}
                                />
                            </li>
                            {/* Opcional: Agregar el botón de cerrar sesión aquí o en el perfil */}
                            <li>
                                <button className="nav-button nav-link-button nav-logout-button" onClick={logout}>
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
                    <Route path="/perfil" element={<PrivateRoute><Perfil user={user} logout={logout} getProfileImageUrl={getProfileImageUrl} /></PrivateRoute>} />
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
