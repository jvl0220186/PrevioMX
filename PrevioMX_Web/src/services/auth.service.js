import apiClient from './api.service'

const authService = {
  /**
   * Inicia sesión y obtiene el token JWT
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} Respuesta con token y datos del usuario
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      })
      
      if (response.data.token) {
        // Guardar token y datos del usuario
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Cierra sesión
   */
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  /**
   * Obtiene el token almacenado
   * @returns {string|null} Token JWT o null
   */
  getToken() {
    return localStorage.getItem('token')
  },

  /**
   * Obtiene los datos del usuario almacenados
   * @returns {Object|null} Datos del usuario o null
   */
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} true si está autenticado
   */
  isAuthenticated() {
    return !!this.getToken()
  },

  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} Respuesta del servidor
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Refresca el token JWT
   * @returns {Promise} Nuevo token
   */
  async refreshToken() {
    try {
      const response = await apiClient.post('/auth/refresh')
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  }
}

export default authService

