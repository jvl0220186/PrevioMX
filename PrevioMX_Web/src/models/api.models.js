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
 * @typedef {Object} CatalogoProveedoresRequest
 * @property {string} [filtro] - Filtro de búsqueda
 * @property {number} [pageNumber] - Número de página (0-based)
 * @property {number} [pageSize] - Tamaño de página
 */

/**
 * @typedef {Object} CatalogoProveedoresResponse
 * @property {CatalogoItemDto[]} [items]
 * @property {number} [page]
 * @property {number} [size]
 * @property {number} [totalRecords]
 * @property {number} [totalPages]
 * @property {boolean} [more]
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
 * @typedef {Object} EliminarPartidaRequest
 * @property {string} idBulto - ID del bulto
 * @property {string} referencia - Referencia de la entrada
 * @property {string} idProducto - Número de parte del producto
 */

/**
 * @typedef {Object} EliminarPartidaResponse
 * @property {boolean} [estatus]
 * @property {string} [msg]
 */

/**
 * @typedef {Object} RegistrarPartidaRequest
 * @property {string} [idBulto]
 * @property {string} [referencia]
 * @property {string} [idProveedor]
 * @property {string} [idProducto]
 * @property {string} [um]
 * @property {string} [cantidad]
 * @property {string} [subCantidad]
 * @property {string} [paisOrigen]
 * @property {string} [comentarios]
 * @property {string} [usuario]
 * @property {string} [ocCompra]
 * @property {string} [noParteFisico]
 * @property {string} [mms]
 */

/**
 * @typedef {Object} ActualizarPartidaRequest
 * @property {number} [id]
 * @property {string} [idBulto]
 * @property {string} [referencia]
 * @property {string} [idProveedor]
 * @property {string} [idProducto]
 * @property {string} [um]
 * @property {string} [cantidad]
 * @property {string} [subCantidad]
 * @property {string} [paisOrigen]
 * @property {string} [comentarios]
 * @property {string} [usuario]
 * @property {string} [ocCompra]
 * @property {string} [noParteFisico]
 * @property {string} [mms]
 */

/**
 * @typedef {Object} AgregarOpenPORequest
 * @property {string} referencia - Referencia de la entrada
 * @property {string} po - Orden de compra (PO)
 * @property {string} packing - Packing
 */

/**
 * @typedef {Object} AgregarOpenPOResponse
 * @property {boolean} [estatus]
 * @property {string} [msg]
 */

/**
 * @typedef {Object} ValidarPostRequest
 * @property {string} idEntrada - ID de la entrada
 * @property {string} idProducto - Número de parte del producto
 */

/**
 * @typedef {Object} ValidarPostResponse
 * @property {string} [clasificacion]
 * @property {string} [descripcion]
 * @property {boolean} [isSpum]
 * @property {string} [spUm]
 * @property {boolean} [isSppo]
 * @property {string} [spPo]
 * @property {boolean} [isSpmms]
 * @property {string} [spMms]
 * @property {string} [spCantidades]
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
