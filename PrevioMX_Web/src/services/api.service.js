import axios from 'axios'
import { API_CONFIG } from '../config/api.config'

// Función para redirigir al login
const redirectToLogin = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('captureData')
  // Evitar múltiples redirecciones
  if (window.location.pathname !== '/') {
    window.location.href = '/'
  }
}

// Verificar si el token parece expirado (decodificar JWT básico)
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

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    
    // Verificar si el token está expirado antes de hacer la petición
    if (token) {
      if (isTokenExpired(token)) {
        console.warn('Token expirado, redirigiendo al login...')
        redirectToLogin()
        return Promise.reject(new Error('Token expirado'))
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error)
    
    if (error.config) {
      console.log('Failed Request URL:', error.config.url)
      console.log('Failed Request BaseURL:', error.config.baseURL)
      console.log('Failed Request Method:', error.config.method)
      console.log('Full URL:', (error.config.baseURL || '') + error.config.url)
    }

    // Error 401 - No autorizado
    if (error.response?.status === 401) {
      console.warn('Error 401 - Sesión expirada')
      redirectToLogin()
      return Promise.reject(error)
    }

    // Error 403 - Prohibido
    if (error.response?.status === 403) {
      console.warn('Error 403 - Acceso prohibido')
      redirectToLogin()
      return Promise.reject(error)
    }

    // Error de timeout o red - verificar si el token está expirado
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      const token = localStorage.getItem('token')
      if (!token || isTokenExpired(token)) {
        console.warn('Token expirado o no existe durante error de red')
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

