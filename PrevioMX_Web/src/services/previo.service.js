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
   * Valida un token de Team Leader
   * @param {string} usuario - Nombre corto del usuario logueado
   * @param {string} token - Token capturado
   * @returns {Promise<{correcto: boolean, mensaje: string, usuarioAprobo: string}>} Resultado de la validación
   */
  async validarTokenTeamLeader(usuario, token) {
    try {
      const response = await apiClient.post('/api/Protected/valida-token-teamleader', {
        usuario,
        token
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Obtiene la lista de pendientes de visualización por equipo
   * @param {string} equipo - Nombre del equipo
   * @returns {Promise<import('../models/api.models').PendientesResponse>} Lista de pendientes
   */
  async getPendientes(equipo) {
    try {
      const response = await apiClient.get(`/api/Visualization/pendientes/${encodeURIComponent(equipo)}`)
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
  },

  /**
   * Obtiene la clasificación de un producto
   * @param {string} idEntrada - ID de la entrada
   * @param {string} idProducto - Número de parte del producto
   * @returns {Promise<{clasificacion: string, descripcion: string}>} Clasificación y descripción
   */
  async getClasificacion(idEntrada, idProducto) {
    try {
      const response = await apiClient.get(`/api/Clasificacion/${idEntrada}/${encodeURIComponent(idProducto)}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Obtiene el detalle de POs para entradas OpenPO
   * @param {string} idEntrada - ID de la entrada
   * @returns {Promise<{items: Array}>} Lista de POs con sus productos
   */
  async getDetallePOs(idEntrada) {
    try {
      const response = await apiClient.get(`/api/Visualization/detalle-pos/${idEntrada}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Registra una partida
   * @param {Object} request - Datos de la partida
   * @param {string} request.idBulto - ID del bulto
   * @param {string} request.referencia - Referencia de la entrada
   * @param {string} request.idProducto - Número de parte
   * @param {string} request.um - Unidad de medida
   * @param {string} request.cantidad - Cantidad
   * @param {string} request.subCantidad - Sub cantidad
   * @param {string} request.paisOrigen - País de origen
   * @param {string} request.comentarios - Comentarios/Notas
   * @param {string} request.usuario - Usuario que registra
   * @param {string} request.ocCompra - Orden de compra
   * @returns {Promise<{estatus: boolean, msg: string}>} Resultado del registro
   */
  async registrarPartida(request) {
    try {
      const response = await apiClient.post('/api/Visualization/registrar-partida', request)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Actualiza una partida existente
   * @param {Object} request - Datos de la partida a actualizar
   * @param {string} request.id - ID único de la partida
   * @param {string} request.idBulto - ID del bulto
   * @param {string} request.referencia - Referencia de la entrada
   * @param {string} request.idProducto - Número de parte
   * @param {string} request.um - Unidad de medida
   * @param {string} request.cantidad - Cantidad
   * @param {string} request.subCantidad - Sub cantidad
   * @param {string} request.paisOrigen - País de origen
   * @param {string} request.comentarios - Comentarios/Notas
   * @param {string} request.usuario - Usuario que actualiza
   * @param {string} request.ocCompra - Orden de compra
   * @returns {Promise<{estatus: boolean, msg: string}>} Resultado de la actualización
   */
  async actualizarPartida(request) {
    try {
      // TODO: Actualizar endpoint cuando sea proporcionado
      const response = await apiClient.put('/api/Visualization/actualizar-partida', request)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Valida una marca capturada contra el catálogo
   * @param {string} referencia - Referencia de la entrada
   * @param {string} idProducto - Número de parte del producto
   * @param {string} marca - Marca capturada
   * @returns {Promise<{Valido: boolean}>} Resultado de la validación
   */
  async validarMarca(referencia, idProducto, marca) {
    try {
      const response = await apiClient.post('/api/Visualization/validar-marca', {
        referencia,
        idProducto,
        marca
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Valida un modelo capturado contra el catálogo
   * @param {string} referencia - Referencia de la entrada
   * @param {string} idProducto - Número de parte del producto
   * @param {string} modelo - Modelo capturado
   * @returns {Promise<{Valido: boolean}>} Resultado de la validación
   */
  async validarModelo(referencia, idProducto, modelo) {
    try {
      const response = await apiClient.post('/api/Visualization/validar-modelo', {
        referencia,
        idProducto,
        modelo
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  }
}

export default previoService
