import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
// Asumimos que tienes un AuthContext que provee el estado del usuario.
// Si tu archivo se llama diferente, ajusta la importación.
import { AuthContext } from "./AuthContext"; 

/**
 * Componente para proteger rutas. Verifica si un usuario está autenticado
 * y si tiene el rol requerido para acceder a una página.
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - El componente/página a renderizar si se cumplen las condiciones.
 * @param {string|string[]} props.requiredRole - Opcional. El rol o roles necesarios para acceder.
 */
const PrivateRoute = ({ children, requiredRole }) => {
  // Obtiene el estado del usuario desde el contexto de autenticación.
  const { user } = useContext(AuthContext);
  // Obtiene la ubicación actual para poder redirigir de vuelta después del login.
  const location = useLocation();

  // 1. Comprobación de Autenticación:
  // Si no hay un objeto 'user', significa que nadie ha iniciado sesión.
  if (!user) {
    // Redirige al usuario a la página de login.
    // 'state={{ from: location }}' guarda la página a la que intentaba acceder.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Comprobación de Rol (si se especifica):
  if (requiredRole) {
    // Permite que 'requiredRole' sea un solo string (ej: "admin") o un array (ej: ["admin", "profesor"]).
    const rolesAllowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Si el rol del usuario actual NO está en la lista de roles permitidos...
    if (!rolesAllowed.includes(user.role)) {
      // ...redirige a una página de "Acceso No Autorizado".
      return <Navigate to="/no-autorizado" replace />;
    }
  }

  // 3. Acceso Permitido:
  // Si el usuario está autenticado y tiene el rol correcto (o no se requiere un rol),
  // renderiza el componente hijo (la página protegida).
  return children;
};

export default PrivateRoute;
