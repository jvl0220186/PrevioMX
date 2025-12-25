using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrevioMX_Api.Business;
using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requiere autenticación JWT
public class ClasificacionController : ControllerBase
{
    private readonly IClasificacionService _clasificacionService;
    private readonly ILogger<ClasificacionController> _logger;

    public ClasificacionController(IClasificacionService clasificacionService, ILogger<ClasificacionController> logger)
    {
        _clasificacionService = clasificacionService;
        _logger = logger;
    }

    /// <summary>
    /// Valida la clasificación de un producto para una entrada específica
    /// </summary>
    /// <param name="request">ID de entrada y ID de producto</param>
    /// <returns>Clasificación y descripción del producto</returns>
    [HttpPost("validar")]
    public async Task<ActionResult<ValidarClasificacionResponse>> ValidarClasificacion([FromBody] ValidarClasificacionRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.IdEntrada) || string.IsNullOrWhiteSpace(request.IdProducto))
            {
                return BadRequest(new { message = "IdEntrada e IdProducto son requeridos" });
            }

            var result = await _clasificacionService.ValidarClasificacionAsync(request.IdEntrada, request.IdProducto);
            
            if (result == null)
            {
                return NotFound(new { message = "No se encontró clasificación para los parámetros proporcionados" });
            }
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar clasificación para Entrada: {IdEntrada}, Producto: {IdProducto}", 
                request.IdEntrada, request.IdProducto);
            return StatusCode(500, new { message = "Error al validar la clasificación", error = ex.Message });
        }
    }

    /// <summary>
    /// Valida la clasificación de un producto para una entrada específica (GET)
    /// </summary>
    /// <param name="idEntrada">ID de la entrada</param>
    /// <param name="idProducto">ID del producto</param>
    /// <returns>Clasificación y descripción del producto</returns>
    [HttpGet("{idEntrada}/{idProducto}")]
    public async Task<ActionResult<ValidarClasificacionResponse>> ValidarClasificacionGet(string idEntrada, string idProducto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(idEntrada) || string.IsNullOrWhiteSpace(idProducto))
            {
                return BadRequest(new { message = "IdEntrada e IdProducto son requeridos" });
            }

            var result = await _clasificacionService.ValidarClasificacionAsync(idEntrada, idProducto);
            
            if (result == null)
            {
                return NotFound(new { message = "No se encontró clasificación para los parámetros proporcionados" });
            }
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar clasificación para Entrada: {IdEntrada}, Producto: {IdProducto}", 
                idEntrada, idProducto);
            return StatusCode(500, new { message = "Error al validar la clasificación", error = ex.Message });
        }
    }
}

