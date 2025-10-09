import axios from 'axios';

// Define la URL base del backend. 
// Utiliza la variable de entorno REACT_APP_API_URL si está definida (ej. en .env)
// Si no está definida, usa 'http://localhost:5000' como fallback.
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * Instancia de Axios configurada para manejar todas las peticiones a la API.
 * * NOTA: Esta instancia se exporta para que otros módulos (como AuthContext) 
 * puedan establecer encabezados globales, como el token de autorización.
 */
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
