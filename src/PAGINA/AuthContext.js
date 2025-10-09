import React, { createContext, useState, useEffect } from 'react';

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
    // Nota: El token no se almacena en el estado, solo en localStorage para seguridad,
    // pero se verifica al inicio para cargar el usuario.

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

    // 4. Función de utilidad para obtener la URL de la imagen (manteniendo la lógica que usabas)
    const getProfileImageUrl = (foto) => {
        // Usa una URL de placeholder si la foto no está disponible
        if (foto && typeof foto === 'string' && foto.length > 0) {
            // Esto solo es un fallback por si no funciona la API
            return `https://placehold.co/100x100/38a169/ffffff?text=${foto.substring(0,1).toUpperCase()}`;
        }
        // URL por defecto si no hay foto
        return "http://localhost:5000/uploads/fotos/default.png";
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

