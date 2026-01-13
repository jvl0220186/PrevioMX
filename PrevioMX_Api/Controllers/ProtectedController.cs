using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrevioMX_Api.Business;
using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requiere autenticación JWT
public class ProtectedController : ControllerBase
{
    private readonly ILogger<ProtectedController> _logger;
    private readonly AuthDbContext _context;

    public ProtectedController(ILogger<ProtectedController> logger, AuthDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Endpoint protegido - requiere autenticación JWT
    /// </summary>
    [HttpGet("test")]
    public IActionResult GetProtectedData()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var userName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

        return Ok(new
        {
            message = "Este es un endpoint protegido",
            userId,
            userEmail,
            userName,
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Valida el token de un Team Leader
    /// </summary>
    [HttpPost("ValidaTokenTeamLeader")]
    public async Task<IActionResult> ValidaTokenTeamLeader([FromBody] ValidarTokenTeamleaderRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _context.ValidarTokenTeamleaderAsync(request.Usuario, request.Token);

        if (result == null)
        {
            return NotFound(new { message = "No se pudo validar el token" });
        }

        if (result.Correcto == true)
        {
            return Ok(new
            {
                correcto = result.Correcto,
                mensaje = result.Mensaje,
                usuarioAprobo = result.UsuarioAprobo
            });
        }

        return Unauthorized(new
        {
            correcto = result.Correcto,
            mensaje = result.Mensaje
        });
    }
}

