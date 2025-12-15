namespace PrevioMX_Api.DTO;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public string IdUsuario { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Equipo { get; set; } = string.Empty;
    public string GrupoId { get; set; } = string.Empty;
    public string Lider { get; set; } = string.Empty;
}

