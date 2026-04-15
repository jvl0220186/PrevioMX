using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public class AuthService : IAuthService
{
    private readonly IJwtService _jwtService;
    private readonly AuthDbContext _context;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IJwtService jwtService, AuthDbContext context, ILogger<AuthService> logger)
    {
        _jwtService = jwtService;
        _context = context;
        _logger = logger;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        // Ejecutar stored procedure CSP_PMX_Login
        var loginResult = await _context.LoginAsync(request.Usuario, request.Password);
        //onecore.security.utils.EncryptService.DecryptTokenLogin(loginResult);

        if (loginResult == null)
        {
            _logger.LogWarning("Intento de login fallido para usuario: {Usuario}", request.Usuario);
            return null;
        }

        // Generar tokens
        var token = _jwtService.GenerateToken(loginResult);
        var refreshToken = _jwtService.GenerateRefreshToken();

        return new AuthResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                IdUsuario = loginResult.IdUsuario,
                Usuario = loginResult.Usuario,
                CorreoElectronico = loginResult.CorreoElectronico,
                Equipo = loginResult.Equipo,
                GrupoId = loginResult.GrupoId,
                Lider = loginResult.Lider
            }
        };
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        // TODO: Implementar cuando se proporcione el stored procedure de registro
        _logger.LogWarning("Registro no implementado aún. Esperando stored procedure.");
        return null;
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
    {
        // TODO: Implementar cuando se proporcione el stored procedure de refresh token
        _logger.LogWarning("Refresh token no implementado aún. Esperando stored procedure.");
        return null;
    }

}

