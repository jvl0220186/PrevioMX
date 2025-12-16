/**
 * @typedef {Object} LoginRequest
 * @property {string} [usuario]
 * @property {string} [password]
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [password]
 */

/**
 * @typedef {Object} RefreshTokenRequest
 * @property {string} [refreshToken]
 */

/**
 * @typedef {Object} UserDto
 * @property {string} [idUsuario]
 * @property {string} [usuario]
 * @property {string} [correoElectronico]
 * @property {string} [equipo]
 * @property {string} [grupoId]
 * @property {string} [lider]
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} [token]
 * @property {string} [refreshToken]
 * @property {UserDto} [user]
 */

/**
 * @typedef {Object} CatalogoItemDto
 * @property {string} [cValue]
 * @property {string} [cText]
 */

/**
 * @typedef {Object} CatalogosResponse
 * @property {CatalogoItemDto[]} [items]
 */

/**
 * @typedef {Object} DetalleEntradaDto
 * @property {string} [idEntrada]
 * @property {string} [idBulto]
 * @property {string} [id]
 * @property {string} [idProducto]
 * @property {string} [ocCompra]
 * @property {string} [um]
 * @property {string} [paisOrigen]
 * @property {boolean} [discrepancia]
 * @property {string} [cantidad]
 * @property {string} [cantidadCartones]
 * @property {number} [precioUnitario]
 * @property {string} [comentarios]
 * @property {boolean} [clasificado]
 * @property {boolean} [series]
 */

/**
 * @typedef {Object} DetalleEntradaResponse
 * @property {DetalleEntradaDto[]} [items]
 */

/**
 * @typedef {Object} PendienteDto
 * @property {string} [idEntrada]
 * @property {string} [idBodega]
 * @property {string} [bodega]
 * @property {string} [idCliente]
 * @property {string} [cliente]
 * @property {string} [idProveedor]
 * @property {string} [proveedor]
 * @property {string} [fechaEntrada]
 * @property {string} [fechaPrevio]
 * @property {number} [bultos]
 * @property {string} [tipoEnvio]
 * @property {string} [estatus]
 * @property {string} [tipoCaptura]
 * @property {string} [fechaDocumento]
 * @property {string} [rutaDocumento]
 * @property {boolean} [esOpenpo]
 */

/**
 * @typedef {Object} PendientesResponse
 * @property {PendienteDto[]} [items]
 */

/**
 * @typedef {Object} ValidarCierrePrevioResponse
 * @property {boolean} [estatus]
 * @property {number} [bultosTotales]
 * @property {number} [bultosPrevio]
 * @property {string} [msg]
 */

/**
 * @typedef {Object} WeatherForecast
 * @property {string} [date]
 * @property {number} [temperatureC]
 * @property {number} [temperatureF]
 * @property {string} [summary]
 */

/**
 * @typedef {Object} ProblemDetails
 * @property {string} [type]
 * @property {string} [title]
 * @property {number} [status]
 * @property {string} [detail]
 * @property {string} [instance]
 */

export {}
