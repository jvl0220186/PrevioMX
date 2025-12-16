import apiClient from './api.service'

/**
 * Servicio para consultar endpoints de la API de PrevioMX (Catálogos y Visualización)
 */
const previoService = {
  /**
   * Obtiene items de un catálogo específico
   * @param {number} catalogoId - ID del catálogo a consultar
   * @returns {Promise<import('../models/api.models').CatalogosResponse>} Items del catálogo
   */
  async getCatalogo(catalogoId) {
    try {
      const response = await apiClient.get(`/api/Catalogos/${catalogoId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Endpoint protegido de prueba
   * @returns {Promise<void>}
   */
  async getProtectedTest() {
    try {
      await apiClient.get('/api/Protected/test')
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Obtiene la lista de pendientes de visualización
   * @returns {Promise<import('../models/api.models').PendientesResponse>} Lista de pendientes
   */
  async getPendientes() {
    try {
      const response = await apiClient.get('/api/Visualization/pendientes')
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Obtiene el detalle de una entrada específica
   * @param {string} idEntrada - ID de la entrada
   * @returns {Promise<import('../models/api.models').DetalleEntradaResponse>} Detalle de la entrada
   */
  async getDetalleEntrada(idEntrada) {
    try {
      const response = await apiClient.get(`/api/Visualization/detalle-entrada/${idEntrada}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Valida si se puede cerrar un previo
   * @param {string} idEntrada - ID de la entrada
   * @returns {Promise<import('../models/api.models').ValidarCierrePrevioResponse>} Resultado de la validación
   */
  async validarCierrePrevio(idEntrada) {
    try {
      const response = await apiClient.get(`/api/Visualization/validar-cierre-previo/${idEntrada}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Obtiene el pronóstico del tiempo (Endpoint de prueba)
   * @returns {Promise<import('../models/api.models').WeatherForecast[]>} Pronóstico del tiempo
   */
  async getWeatherForecast() {
    try {
      const response = await apiClient.get('/WeatherForecast')
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  }
}

export default previoService
