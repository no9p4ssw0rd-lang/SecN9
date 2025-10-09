import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// La URL de la API se obtiene de las variables de entorno para flexibilidad
// en desarrollo y producción (Vercel).
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!identifier || !password) {
      setError("Por favor, ingresa tu correo/teléfono y contraseña.");
      setLoading(false);
      return;
    }

    try {
      // Usamos la variable API_URL para construir la dirección de la petición
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.toLowerCase(), // Normalizar el email a minúsculas
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Muestra un mensaje de error más específico si el servidor lo envía
        setError(data.msg || data.error || "Credenciales incorrectas. Por favor, verifica tus datos.");
        setLoading(false);
        return;
      }

      if (!data.token || !data.user) {
        setError("Login fallido: no se recibió una respuesta válida del servidor.");
        setLoading(false);
        return;
      }

      // Guardar token y datos del usuario en el almacenamiento local
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Ejecutar la función onLogin del componente padre para actualizar el estado global
      if (onLogin) {
        onLogin(data.user, data.token);
      }
      
      // Redirigir al usuario según su rol
      switch (data.user.role) {
        case "admin":
        case "profesor":
          navigate("/"); // Dashboard principal para admin y profesor
          break;
        default:
          navigate("/perfil"); // Perfil para otros roles (ej. alumno)
          break;
      }
    } catch (err) {
      console.error("Error en la petición de login:", err);
      setError("No se pudo conectar con el servidor. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label htmlFor="identifier">Correo o Teléfono</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ingresa tu correo o teléfono"
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

        <button
          className="forgot-btn"
          onClick={() => navigate("/forgot-password")}
        >
          Olvidé mi contraseña
        </button>
      </div>
    </div>
  );
}

export default Login;