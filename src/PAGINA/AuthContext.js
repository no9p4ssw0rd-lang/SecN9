import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient'; // IMPORTANTE: Asegúrate de que existe este archivo

// ----------------------------------------------------
// VARIABLES DE ENTORNO Y CONSTANTES
// ----------------------------------------------------
// Estas constantes son útiles, aunque la lógica de la imagen no las use directamente si Cloudinary devuelve URL completa
const DEFAULT_FALLBACK_URL = "https://placehold.co/150x150/EFEFEF/AAAAAA&text=Sin+Foto";

// Crea el contexto con valores por defecto
export const AuthContext = createContext({
    user: null,
    loading: true,
    login: () => {},
    logout: () => {},
    updateUser: () => {}, // Agregamos updateUser
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
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    // CONFIGURACIÓN API: Seteamos el header de autorización para que funcione apiClient
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    console.error("Error parsing user data or setting API token:", error);
                    // Sesión inválida, limpiar
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
        
        // Seteamos el header del cliente API
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Actualiza el estado global
        setUser(userData);
    };

    // 3. Función de Cierre de Sesión
    const logout = () => {
        // Limpia el almacenamiento
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Limpia el header del cliente API
        delete apiClient.defaults.headers.common['Authorization'];

        // Limpia el estado global
        setUser(null);
    };
    
    // 4. Función de Actualización de Perfil (usada por EditarPerfil)
    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    // 5. Función de utilidad para obtener la URL de la imagen (CORREGIDA)
    const getProfileImageUrl = (foto) => {
        // Verificamos si la foto es una URL completa (Cloudinary o externa)
        if (foto && typeof foto === 'string' && (foto.startsWith("http://") || foto.startsWith("https://"))) {
            return foto; 
        }
        
        // Si no es una URL completa o si es nula, usamos el placeholder
        return DEFAULT_FALLBACK_URL;
    };

    const contextValue = {
        user,
        loading,
        login,
        logout,
        updateUser, // Exportamos la función updateUser
        getProfileImageUrl,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
