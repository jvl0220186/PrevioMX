using System.ComponentModel.DataAnnotations;

namespace PrevioMX_Api.DTO;

public class ValidarTokenTeamleaderRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}
