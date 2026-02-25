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
      const response = await apiClient.get(`/api/Catalogos/${encodeURIComponent(catalogoId)}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Obtiene el catálogo de proveedores con filtro y paginación
   * @param {Object} request - Parámetros de búsqueda
   * @param {string} [request.filtro] - Filtro de búsqueda
   * @param {number} [request.pageNumber] - Número de página (0-based)
   * @param {number} [request.pageSize] - Tamaño de página
   * @returns {Promise<import('../models/api.models').CatalogoProveedoresResponse>} Items paginados (cValue, cText) e información de paginación
   */
  async getCatalogoProveedores(request) {
    try {
      const response = await apiClient.post('/api/Catalogos/catalogo-proveedores', request)
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
      const response = await apiClient.get(`/api/Visualization/detalle-entrada/${encodeURIComponent(idEntrada)}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Valida si se puede cerrar un previo
   * @param {string} idEntrada - ID de la entrada
   * @param {boolean} discrepancia - Si se envía con discrepancia
   * @param {boolean} aplicaNom144 - Si aplica NOM 144
   * @returns {Promise<import('../models/api.models').ValidarCierrePrevioResponse>} Resultado de la validación
   */
  async validarCierrePrevio(idEntrada, discrepancia, aplicaNom144) {
    try {
      const discrepanciaStr = discrepancia === true ? 'true' : 'false'
      const aplicaNom144Str = aplicaNom144 === true ? 'true' : 'false'
      const response = await apiClient.get(`/api/Visualization/validar-cierre-previo/${encodeURIComponent(idEntrada)}/${discrepanciaStr}/${aplicaNom144Str}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Verifica si existe un previo cerrado para la referencia
   * @param {string} referencia - ID de la entrada / referencia
   * @returns {Promise<import('../models/api.models').EliminarPartidaResponse>} { estatus, msg }
   */
  async existePrevioCerrado(referencia) {
    try {
      const response = await apiClient.get(`/api/Visualization/existe-previo-cerrado/${encodeURIComponent(referencia)}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Verifica si el usuario puede reabrir previo (validación con usuario y password)
   * @param {import('../models/api.models').LoginRequest} request - { usuario, password }
   * @returns {Promise<import('../models/api.models').PuedeReabrirPrevioResponse>} { usuario, lUsuario, puedeRegenerar }
   */
  async puedeReabrirPrevio(request) {
    try {
      const response = await apiClient.post('/api/Visualization/puede-reabrir-previo', request)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Reabre un previo cerrado para la referencia indicada
   * @param {string} referencia - ID de la entrada / referencia
   * @returns {Promise<import('../models/api.models').PendienteDto>} Mismo modelo que un ítem de la tabla de pendientes (idEntrada, documentos, estatus, etc.)
   */
  async reabrePrevio(referencia) {
    try {
      const response = await apiClient.get(`/api/Visualization/reabre-previo/${encodeURIComponent(referencia)}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Obtiene el proveedor del previo para la referencia
   * @param {string} referencia - ID de la entrada / referencia
   * @returns {Promise<import('../models/api.models').ProveedorPrevioResponse>} { idProveedor (string|null), proveedor (string|null), estatus, msg }
   */
  async proveedorPrevio(referencia) {
    try {
      const response = await apiClient.get(`/api/Visualization/proveedor-previo/${encodeURIComponent(referencia)}`)
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
      const response = await apiClient.get(`/api/Clasificacion/${encodeURIComponent(idEntrada)}/${encodeURIComponent(idProducto)}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Valida producto vía POST (clasificación y Standard Pack)
   * @param {Object} request - Datos para validar
   * @param {string} request.idEntrada - ID de la entrada
   * @param {string} request.idProducto - Número de parte del producto
   * @returns {Promise<import('../models/api.models').ValidarPostResponse>} Clasificación, descripción y datos Standard Pack
   */
  async validarPost(request) {
    try {
      const response = await apiClient.post('/api/Clasificacion/validar-post', request)
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
      const response = await apiClient.get(`/api/Visualization/detalle-pos/${encodeURIComponent(idEntrada)}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Registra una partida
   * @param {import('../models/api.models').RegistrarPartidaRequest} request - Datos de la partida
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
   * @param {import('../models/api.models').ActualizarPartidaRequest} request - Datos de la partida a actualizar
   * @returns {Promise<{estatus: boolean, msg: string}>} Resultado de la actualización
   */
  async actualizarPartida(request) {
    try {
      const response = await apiClient.put('/api/Visualization/actualizar-partida', request)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Elimina una partida
   * @param {Object} request - Datos para identificar la partida a eliminar
   * @param {string} request.idBulto - ID del bulto
   * @param {string} request.referencia - Referencia de la entrada
   * @param {string} request.idProducto - Número de parte del producto
   * @returns {Promise<{estatus: boolean, msg: string}>} Resultado de la eliminación
   */
  async eliminarPartida(request) {
    try {
      const response = await apiClient.delete('/api/Visualization/eliminar-partida', { data: request })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /**
   * Agrega un OpenPO a una referencia
   * @param {Object} request - Datos para agregar OpenPO
   * @param {string} request.referencia - Referencia de la entrada
   * @param {string} request.po - Orden de compra (PO)
   * @param {string} request.packing - Packing
   * @returns {Promise<{estatus: boolean, msg: string}>} Resultado de la operación
   */
  async agregarOpenPO(request) {
    try {
      const response = await apiClient.post('/api/Visualization/agregar-openpo', request)
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
