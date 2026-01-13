using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrevioMX_Api.Business;
using PrevioMX_Api.DTO;
using System.Security.Claims;

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
    /// <returns>Resultado de la validación del cierre de previo</returns>
    [HttpGet("validar-cierre-previo/{idEntrada}")]
    [ProducesResponseType(typeof(ValidarCierrePrevioResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ValidarCierrePrevioResponse>> GetValidarCierrePrevio(string idEntrada)
    {
        try
        {
            // Obtener el ID del usuario del token JWT
            var idUsuario = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario del token JWT" });
            }

            var response = await _visualizationService.GetValidarCierrePrevioAsync(idEntrada, idUsuario);
            
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
}

