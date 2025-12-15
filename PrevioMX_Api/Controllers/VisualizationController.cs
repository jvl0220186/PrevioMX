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
    /// Obtener pendientes
    /// </summary>
    /// <returns>Lista de pendientes</returns>
    [HttpGet("pendientes")]
    public async Task<ActionResult<PendientesResponse>> GetPendientes()
    {
        try
        {
            var result = await _visualizationService.GetPendientesAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener pendientes");
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
}

