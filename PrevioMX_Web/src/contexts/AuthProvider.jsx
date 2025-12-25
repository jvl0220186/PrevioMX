import { useState, useEffect } from 'react'
import { AuthContext } from './AuthContext.js'
import authService from '../services/auth.service'

// Verificar si el token JWT está expirado
const isTokenExpired = (token) => {
    if (!token) return true
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000 // convertir a milliseconds
        return Date.now() >= exp
    } catch (e) {
        return true // Si no se puede decodificar, asumir expirado
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

    useEffect(() => {
        if (isDevMode) {
            const mockUser = {
                id: 'dev-user',
                email: 'dev@previo.com',
                name: 'Developer User'
            }
            setUser(mockUser)
            setLoading(false)
            return
        }

        const token = authService.getToken()
        const savedUser = authService.getUser()
        
        // Verificar que el token exista, no esté expirado y haya usuario guardado
        if (savedUser && token && !isTokenExpired(token)) {
            setUser(savedUser)
        } else {
            // Si el token está expirado o no existe, limpiar datos
            if (token && isTokenExpired(token)) {
                console.warn('Token expirado al iniciar, limpiando sesión...')
                authService.logout()
            }
            setUser(null)
        }
        setLoading(false)
    }, [isDevMode])

    const login = async (email, password) => {
        if (isDevMode) {
            const mockUser = {
                id: 'dev-user',
                email: email || 'dev@previo.com',
                name: 'Developer User'
            }
            setUser(mockUser)
            return { user: mockUser, token: 'dev-token' }
        }

        try {
            const response = await authService.login(email, password)
            setUser(response.user)
            return response
        } catch (error) {
            throw error
        }
    }

    const logout = () => {
        authService.logout()
        setUser(null)
    }

    const register = async (userData) => {
        try {
            const response = await authService.register(userData)
            return response
        } catch (error) {
            throw error
        }
    }

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        isAuthenticated: !!user
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
