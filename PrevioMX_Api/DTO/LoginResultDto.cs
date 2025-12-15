namespace PrevioMX_Api.DTO;

/// <summary>
/// DTO que representa el resultado del stored procedure CSP_PMX_Login
/// </summary>
public class LoginResultDto
{
    public string IdUsuario { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Equipo { get; set; } = string.Empty;
    public string GrupoId { get; set; } = string.Empty;
    public string Lider { get; set; } = string.Empty;
}

