using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrevioMX_Api.Business;
using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] // Endpoints de autenticación no requieren JWT
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Iniciar sesión
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _authService.LoginAsync(request);

        if (response == null)
        {
            return Unauthorized(new { message = "Credenciales inválidas" });
        }

        return Ok(response);
    }

    /// <summary>
    /// Registrar nuevo usuario
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _authService.RegisterAsync(request);

        if (response == null)
        {
            return Conflict(new { message = "El email ya está registrado" });
        }

        return Ok(response);
    }

    /// <summary>
    /// Refrescar token de acceso
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            return BadRequest(new { message = "Refresh token es requerido" });
        }

        var response = await _authService.RefreshTokenAsync(request.RefreshToken);

        if (response == null)
        {
            return Unauthorized(new { message = "Refresh token inválido o expirado" });
        }

        return Ok(response);
    }
}

