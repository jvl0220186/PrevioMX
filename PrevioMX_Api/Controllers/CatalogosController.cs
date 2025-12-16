using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrevioMX_Api.Business;
using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requiere autenticación JWT
public class CatalogosController : ControllerBase
{
    private readonly ICatalogosService _catalogosService;
    private readonly ILogger<CatalogosController> _logger;

    public CatalogosController(ICatalogosService catalogosService, ILogger<CatalogosController> logger)
    {
        _catalogosService = catalogosService;
        _logger = logger;
    }

    /// <summary>
    /// Obtener catálogo por ID
    /// </summary>
    /// <param name="catalogo">ID del catálogo (ej: 2 para países)</param>
    /// <returns>Lista de items del catálogo</returns>
    [HttpGet("{catalogo}")]
    public async Task<ActionResult<CatalogosResponse>> GetCatalogos(int catalogo)
    {
        try
        {
            var result = await _catalogosService.GetCatalogosAsync(catalogo);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener catálogo {Catalogo}", catalogo);
            return StatusCode(500, new { message = "Error al obtener el catálogo", error = ex.Message });
        }
    }
}

