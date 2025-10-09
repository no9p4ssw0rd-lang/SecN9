import React, { createContext, useState, useEffect } from 'react';
// Importa apiClient si lo usas para obtener el baseURL de tu API
// Asegúrate de que este path sea correcto
import apiClient from '../api/apiClient'; 

// Ruta por defecto que existe en el servidor (para fallback)
const DEFAULT_IMG_PATH = "/uploads/fotos/default.png";

// Se crea el contexto con valores por defecto
export const AuthContext = createContext({
    user: null,
    loading: true,
    login: () => {},
    logout: () => {},
    getProfileImageUrl: () => ""
});

/**
 * Proveedor de Autenticación.
 * Maneja el estado global del usuario, el token de sesión y la carga inicial.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);

    // 1. Efecto para verificar la sesión al cargar la aplicación
    useEffect(() => {
        const checkSession = () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (storedUser && token) {
                try {
                    // Si encontramos datos válidos, cargamos el usuario
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    // Si falla el parseo, la sesión es inválida
                    console.error("Error parsing user data from localStorage:", error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkSession();
    }, []);

    // 2. Función de Inicio de Sesión
    const login = (userData, token) => {
        // Almacena datos del usuario y token
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Actualiza el estado global
        setUser(userData);
    };

    // 3. Función de Cierre de Sesión
    const logout = () => {
        // Limpia el almacenamiento
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Limpia el estado global
        setUser(null);
    };

    // 4. Función de utilidad para obtener la URL de la imagen (AHORA CON CLOUDINARY)
    const getProfileImageUrl = (fotoUrl) => {
        // Si la URL es una URL completa (de Cloudinary), úsala directamente.
        if (fotoUrl && fotoUrl.startsWith("https://")) {
            return fotoUrl;
        }

        // Si la URL es la ruta local antigua o la ruta por defecto:
        // Concatenamos el baseURL de la API (ej. http://localhost:5000) con la ruta interna.
        if (fotoUrl && fotoUrl !== DEFAULT_IMG_PATH) {
            // Asegúrate de que apiClient y su baseURL estén disponibles
            return `${apiClient.defaults.baseURL}${fotoUrl}`;
        }
        
        // URL por defecto (concatenada)
        return `${apiClient.defaults.baseURL}${DEFAULT_IMG_PATH}`;
    };

    const contextValue = {
        user,
        loading,
        login,
        logout,
        getProfileImageUrl,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
