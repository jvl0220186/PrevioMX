using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrevioMX_Api.Business;
using PrevioMX_Api.DTO;
using System.Security.Claims;
using System.Net.Http;

namespace PrevioMX_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requiere autenticación JWT
public class VisualizationController : ControllerBase
{
    private readonly IVisualizationService _visualizationService;
    private readonly ILogger<VisualizationController> _logger;

    public VisualizationController(IVisualizationService visualizationService, ILogger<VisualizationController> logger)
    {
        _visualizationService = visualizationService;
        _logger = logger;
    }

    /// <summary>
    /// Obtener pendientes por equipo
    /// </summary>
    /// <param name="equipo">Identificador del equipo</param>
    /// <returns>Lista de pendientes</returns>
    [HttpGet("pendientes/{equipo}")]
    public async Task<ActionResult<PendientesResponse>> GetPendientes(string equipo)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(equipo))
            {
                return BadRequest(new { message = "Equipo es requerido" });
            }

            var result = await _visualizationService.GetPendientesAsync(equipo);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener pendientes para equipo: {Equipo}", equipo);
            return StatusCode(500, new { message = "Error al obtener los pendientes", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el detalle de una entrada por su ID
    /// </summary>
    /// <param name="idEntrada">ID de la entrada</param>
    /// <returns>Detalle de la entrada</returns>
    [HttpGet("detalle-entrada/{idEntrada}")]
    [ProducesResponseType(typeof(DetalleEntradaResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<DetalleEntradaResponse>> GetDetalleEntrada(string idEntrada)
    {
        try
        {
            var response = await _visualizationService.GetDetalleEntradaAsync(idEntrada);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el detalle de la entrada {IdEntrada}", idEntrada);
            return StatusCode(500, new { message = "Error al obtener el detalle de la entrada", error = ex.Message });
        }
    }

    /// <summary>
    /// Valida el cierre de previo para una entrada
    /// </summary>
    /// <param name="idEntrada">ID de la entrada</param>
    /// <param name="discrepancia">Indica si se está enviando con discrepancia</param>
    /// <param name="aplicaNom144">Indica si aplica NOM-144</param>
    /// <returns>Resultado de la validación del cierre de previo</returns>
    [HttpGet("validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}")]
    [ProducesResponseType(typeof(ValidarCierrePrevioResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ValidarCierrePrevioResponse>> GetValidarCierrePrevio(string idEntrada, bool discrepancia, bool aplicaNom144)
    {
        try
        {
            // Obtener el ID del usuario del token JWT
            var idUsuario = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario del token JWT" });
            }

            var response = await _visualizationService.GetValidarCierrePrevioAsync(idEntrada, idUsuario, discrepancia, aplicaNom144);
            
            if (response == null)
            {
                return NotFound(new { message = "No se encontró información de validación para la entrada especificada" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar el cierre de previo para la entrada {IdEntrada}", idEntrada);
            return StatusCode(500, new { message = "Error al validar el cierre de previo", error = ex.Message });
        }
    }

    /// <summary>
    /// Registra una nueva partida
    /// </summary>
    /// <param name="request">Datos de la partida a registrar</param>
    /// <returns>Resultado del registro</returns>
    [HttpPost("registrar-partida")]
    [ProducesResponseType(typeof(RegistrarPartidaResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<RegistrarPartidaResponse>> RegistrarPartida([FromBody] RegistrarPartidaRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.IdBulto))
            {
                return BadRequest(new { message = "IdBulto es requerido" });
            }

            if (string.IsNullOrWhiteSpace(request.IdProducto))
            {
                return BadRequest(new { message = "IdProducto es requerido" });
            }

            var response = await _visualizationService.RegistrarPartidaAsync(request);
            
            if (response == null)
            {
                return StatusCode(500, new { message = "No se obtuvo respuesta del procedimiento" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al registrar partida para bulto: {IdBulto}, producto: {IdProducto}", 
                request.IdBulto, request.IdProducto);
            return StatusCode(500, new { message = "Error al registrar la partida", error = ex.Message });
        }
    }

    /// <summary>
    /// Actualiza una partida existente
    /// </summary>
    /// <param name="request">Datos de la partida a actualizar</param>
    /// <returns>Resultado de la actualización</returns>
    [HttpPut("actualizar-partida")]
    [ProducesResponseType(typeof(RegistrarPartidaResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<RegistrarPartidaResponse>> ActualizarPartida([FromBody] ActualizarPartidaRequest request)
    {
        try
        {
            if (request.Id <= 0)
            {
                return BadRequest(new { message = "Id es requerido y debe ser mayor a 0" });
            }

            if (string.IsNullOrWhiteSpace(request.IdBulto))
            {
                return BadRequest(new { message = "IdBulto es requerido" });
            }

            if (string.IsNullOrWhiteSpace(request.IdProducto))
            {
                return BadRequest(new { message = "IdProducto es requerido" });
            }

            var response = await _visualizationService.ActualizarPartidaAsync(request);
            
            if (response == null)
            {
                return StatusCode(500, new { message = "No se obtuvo respuesta del procedimiento" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar partida Id: {Id}, bulto: {IdBulto}, producto: {IdProducto}", 
                request.Id, request.IdBulto, request.IdProducto);
            return StatusCode(500, new { message = "Error al actualizar la partida", error = ex.Message });
        }
    }

    /// <summary>
    /// Elimina una partida existente
    /// </summary>
    /// <param name="request">Datos de la partida a eliminar</param>
    /// <returns>Resultado de la eliminación</returns>
    [HttpDelete("eliminar-partida")]
    [ProducesResponseType(typeof(RegistrarPartidaResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<RegistrarPartidaResponse>> EliminarPartida([FromBody] EliminarPartidaRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.IdBulto))
            {
                return BadRequest(new { message = "IdBulto es requerido" });
            }

            if (string.IsNullOrWhiteSpace(request.Referencia))
            {
                return BadRequest(new { message = "Referencia es requerida" });
            }

            if (string.IsNullOrWhiteSpace(request.IdProducto))
            {
                return BadRequest(new { message = "IdProducto es requerido" });
            }

            var response = await _visualizationService.EliminarPartidaAsync(request);
            
            if (response == null)
            {
                return StatusCode(500, new { message = "No se obtuvo respuesta del procedimiento" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar partida para bulto: {IdBulto}, referencia: {Referencia}, producto: {IdProducto}", 
                request.IdBulto, request.Referencia, request.IdProducto);
            return StatusCode(500, new { message = "Error al eliminar la partida", error = ex.Message });
        }
    }

    /// <summary>
    /// Agrega un Open PO a una referencia
    /// </summary>
    /// <param name="request">Datos del Open PO a agregar</param>
    /// <returns>Resultado del registro</returns>
    [HttpPost("agregar-openpo")]
    [ProducesResponseType(typeof(RegistrarPartidaResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<RegistrarPartidaResponse>> AgregarOpenPO([FromBody] AgregarOpenPORequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Referencia))
            {
                return BadRequest(new { message = "Referencia es requerida" });
            }

            if (string.IsNullOrWhiteSpace(request.Po))
            {
                return BadRequest(new { message = "PO es requerido" });
            }

            if (string.IsNullOrWhiteSpace(request.Packing))
            {
                return BadRequest(new { message = "Paking es requerido" });
            }

            var response = await _visualizationService.AgregarOpenPOAsync(request);
            
            if (response == null)
            {
                return StatusCode(500, new { message = "No se obtuvo respuesta del procedimiento" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al agregar Open PO - Referencia: {Referencia}, PO: {Po}, Packing: {Packing}", 
                request.Referencia, request.Po, request.Packing);
            return StatusCode(500, new { message = "Error al agregar el Open PO", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el detalle de POs para una entrada específica
    /// </summary>
    /// <param name="idEntrada">ID de la entrada</param>
    /// <returns>Lista de POs con su detalle</returns>
    [HttpGet("detalle-pos/{idEntrada}")]
    [ProducesResponseType(typeof(DetallePOsResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<DetallePOsResponse>> GetDetallePOs(string idEntrada)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(idEntrada))
            {
                return BadRequest(new { message = "IdEntrada es requerido" });
            }

            var response = await _visualizationService.GetDetallePOsAsync(idEntrada);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el detalle de POs para la entrada {IdEntrada}", idEntrada);
            return StatusCode(500, new { message = "Error al obtener el detalle de POs", error = ex.Message });
        }
    }

    /// <summary>
    /// Valida las cuarentenas para una entrada específica
    /// </summary>
    /// <param name="request">ID de entrada e ID de usuario</param>
    /// <returns>Resultado de la validación de cuarentenas</returns>
    [HttpPost("validar-cuarentenas")]
    [ProducesResponseType(typeof(ValidarCuarentenasResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ValidarCuarentenasResponse>> ValidarCuarentenas([FromBody] ValidarCuarentenasRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.IdUsuario))
            {
                return BadRequest(new { message = "IdUsuario es requerido" });
            }

            var response = await _visualizationService.ValidarCuarentenasAsync(request.IdEntrada, request.IdUsuario);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar cuarentenas para entrada: {IdEntrada}, usuario: {IdUsuario}", 
                request.IdEntrada, request.IdUsuario);
            return StatusCode(500, new { message = "Error al validar cuarentenas", error = ex.Message });
        }
    }

    /// <summary>
    /// Valida la marca de un producto contra la registrada en el sistema
    /// </summary>
    /// <param name="request">Datos de validación de marca</param>
    /// <returns>Resultado de la validación</returns>
    [HttpPost("validar-marca")]
    [ProducesResponseType(typeof(ValidarMarcaDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ValidarMarcaDto>> ValidarMarca([FromBody] ValidarMarcaRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _visualizationService.ValidarMarcaAsync(
                request.Referencia, 
                request.IdProducto, 
                request.Marca);
            
            if (result == null)
            {
                return NotFound(new { message = "No se pudo validar la marca" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar marca para referencia: {Referencia}, producto: {IdProducto}", 
                request.Referencia, request.IdProducto);
            return StatusCode(500, new { message = "Error al validar la marca", error = ex.Message });
        }
    }

    /// <summary>
    /// Valida el modelo de un producto contra el registrado en el sistema
    /// </summary>
    /// <param name="request">Datos de validación de modelo</param>
    /// <returns>Resultado de la validación</returns>
    [HttpPost("validar-modelo")]
    [ProducesResponseType(typeof(ValidarModeloDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ValidarModeloDto>> ValidarModelo([FromBody] ValidarModeloRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _visualizationService.ValidarModeloAsync(
                request.Referencia, 
                request.IdProducto, 
                request.Modelo);
            
            if (result == null)
            {
                return NotFound(new { message = "No se pudo validar el modelo" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar modelo para referencia: {Referencia}, producto: {IdProducto}", 
                request.Referencia, request.IdProducto);
            return StatusCode(500, new { message = "Error al validar el modelo", error = ex.Message });
        }
    }

    /// <summary>
    /// Verifica si un previo existe y está cerrado
    /// </summary>
    /// <param name="referencia">Referencia del previo a verificar</param>
    /// <returns>Estado del previo (cerrado o no)</returns>
    [HttpGet("existe-previo-cerrado/{referencia}")]
    [ProducesResponseType(typeof(RegistrarPartidaResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<RegistrarPartidaResponse>> GetExistePrevioCerrado(string referencia)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(referencia))
            {
                return BadRequest(new { message = "Referencia es requerida" });
            }

            var response = await _visualizationService.GetExistePrevioCerradoAsync(referencia);
            
            if (response == null)
            {
                return StatusCode(500, new { message = "No se obtuvo respuesta del procedimiento" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar si el previo está cerrado - Referencia: {Referencia}", referencia);
            return StatusCode(500, new { message = "Error al verificar si el previo está cerrado", error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el proveedor asociado a un previo por su referencia
    /// </summary>
    /// <param name="referencia">Referencia del previo</param>
    /// <returns>ID del proveedor asociado al previo</returns>
    [HttpGet("proveedor-previo/{referencia}")]
    [ProducesResponseType(typeof(GetProveedorPrevioResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<GetProveedorPrevioResponse>> GetProveedorPrevio(string referencia)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(referencia))
            {
                return BadRequest(new { message = "Referencia es requerida" });
            }

            var response = await _visualizationService.GetProveedorPrevioAsync(referencia);
            
            if (response == null)
            {
                return StatusCode(500, new { message = "No se obtuvo respuesta del procedimiento" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el proveedor del previo - Referencia: {Referencia}", referencia);
            return StatusCode(500, new { message = "Error al obtener el proveedor del previo", error = ex.Message });
        }
    }

    /// <summary>
    /// Valida las credenciales de de usuario para reabrir previo y verifica si el usuario tiene permisos para hacerlo
    /// </summary>
    /// <param name="request">Credenciales</param>
    /// <returns>Resultado de la validación</returns>
    [HttpPost("puede-reabrir-previo")]
    [ProducesResponseType(typeof(ValidaReabrirPrevioResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ValidaReabrirPrevioResponse>> PuedeReabrirPrevio([FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Usuario))
            {
                return BadRequest(new { message = "Usuario es requerido" });
            }
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Contraseña es requerida" });
            }
            var response = await _visualizationService.PuedeReabrirPrevio(request.Usuario, request.Password);
            
            if (response == null)
            {
                return StatusCode(500, new { message = "No se obtuvo respuesta del procedimiento" });
            }
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar si se puede reabrir el previo por credenciales");
            return StatusCode(500, new { message = "Error al validar si se puede reabrir el previo", error = ex.Message });
        }
    }

    /// <summary>
    /// Reapertura de previo para una referencia específica, solo si el previo existe, está cerrado y el usuario tiene permisos para reabrirlo
    /// </summary>
    /// <param name="referencia">Id entrada/referencia</param>
    /// <returns>Datos de previo</returns>
    [HttpGet("reabre-previo/{referencia}")]
    [ProducesResponseType(typeof(PendienteDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<PendienteDto>> ReabrePrevio(string referencia)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(referencia))
            {
                return BadRequest(new { message = "Referencia es requerida" });
            }
            var response = await _visualizationService.ReabrePrevio(referencia);
            
            if (response == null)
            {
                return NotFound(new { message = "No se pudo reabrir el previo, puede que no exista o no esté cerrado" });
            }
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al reabrir el previo para referencia: {Referencia}", referencia);
            return StatusCode(500, new { message = "Error al reabrir el previo", error = ex.Message });
        }
    }

    /// <summary>
    /// Proxy para obtener un PDF desde una URL externa (evita CORS cuando el frontend está en otro origen, ej. web.aduax.com vs vuc.grupoei.com.mx).
    /// Solo se permiten URLs HTTPS de hosts configurados (vuc.grupoei.com.mx por defecto).
    /// </summary>
    /// <param name="url">URL del PDF (codificada). Ej: https://vuc.grupoei.com.mx/vucem/files/...</param>
    [HttpGet("pdf-proxy")]
    [ProducesResponseType(typeof(FileStreamResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(502)]
    public async Task<IActionResult> GetPdfProxy([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest(new { message = "El parámetro url es requerido" });
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uriResult) || !uriResult.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Solo se permiten URLs HTTPS válidas" });
        }

        // Permitir: grupoei.com.mx, aduax.com, Amazon S3 (URLs firmadas) y sus subdominios
        var host = uriResult.Host;
        var allowed = host.Equals("grupoei.com.mx", StringComparison.OrdinalIgnoreCase)
            || host.EndsWith(".grupoei.com.mx", StringComparison.OrdinalIgnoreCase)
            || host.Equals("aduax.com", StringComparison.OrdinalIgnoreCase)
            || host.EndsWith(".aduax.com", StringComparison.OrdinalIgnoreCase)
            || host.EndsWith(".amazonaws.com", StringComparison.OrdinalIgnoreCase);
        if (!allowed)
        {
            _logger.LogWarning("Intento de proxy PDF desde host no permitido: {Host}", host);
            return StatusCode(403, new { message = "Host no permitido para proxy de PDF" });
        }

        try
        {
            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            var response = await httpClient.GetAsync(uriResult);
            response.EnsureSuccessStatusCode();

            var stream = await response.Content.ReadAsStreamAsync();
            var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/pdf";
            return File(stream, contentType);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error al obtener PDF desde {Url}", url);
            return StatusCode(502, new { message = "No se pudo obtener el documento desde el servidor remoto", error = ex.Message });
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout al obtener PDF desde {Url}", url);
            return StatusCode(502, new { message = "Tiempo de espera agotado al obtener el documento" });
        }
    }
}

