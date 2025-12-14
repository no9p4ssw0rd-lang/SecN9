import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext"; // RUTA CORREGIDA: Asume que AuthContext está en la misma carpeta

/**
 * Componente para proteger rutas. Verifica si un usuario está autenticado
 * y si tiene el rol requerido para acceder a una página.
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - El componente/página a renderizar si se cumplen las condiciones.
 * @param {string|string[]} props.requiredRole - Opcional. El rol o roles necesarios para acceder.
 */
const PrivateRoute = ({ children, requiredRole }) => {
  // Obtiene el estado del usuario y el estado de carga desde el contexto de autenticación.
  const { user, loading } = useContext(AuthContext); 
  // Obtiene la ubicación actual para poder redirigir de vuelta después del login.
  const location = useLocation();

  // 1. Si aún está cargando el estado de autenticación, muestra un loader.
  if (loading) {
    return <div className="loading-screen">Cargando autenticación...</div>;
  }

  // 2. Comprobación de Autenticación:
  // Si no hay un objeto 'user', redirige al usuario a la página de login.
  if (!user) {
    // 'state={{ from: location }}' guarda la página a la que intentaba acceder.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Comprobación de Rol (si se especifica):
  if (requiredRole) {
    // Permite que 'requiredRole' sea un solo string (ej: "admin") o un array (ej: ["admin", "profesor"]).
    const rolesAllowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Si el rol del usuario actual NO está en la lista de roles permitidos...
    if (!rolesAllowed.includes(user.role)) {
      // ...redirige a una página de "Acceso No Autorizado".
      return <Navigate to="/no-autorizado" replace />;
    }
  }

  // 4. Acceso Permitido:
  // Si el usuario está autenticado y tiene el rol correcto, renderiza el componente hijo.
  return children;
};

export default PrivateRoute;
