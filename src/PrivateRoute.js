import React from "react";
// Se eliminó 'useContext' y 'Navigate' ya que no hay autenticación.
import { useLocation } from "react-router-dom";


// Este componente ahora es un simple wrapper que siempre permite el acceso.

/**
 * Componente para proteger rutas (ahora inactivo). Siempre renderiza sus hijos

 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - El componente/página a renderizar.
 * @param {string|string[]} props.requiredRole - Opcional. (Ignorado).
 */
const PrivateRoute = ({ children, requiredRole }) => {

  // Se eliminó: const location = useLocation();

  // Se eliminó la verificación de loading.
  // Se eliminó la verificación de user (!user) y la redirección a /login.
  // Se eliminó la verificación de rol (if (requiredRole)).

  // 3. Acceso Permitido:
  // Siempre renderiza el componente hijo.
  return children;
};

export default PrivateRoute;
