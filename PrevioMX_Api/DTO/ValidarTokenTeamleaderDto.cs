using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class ValidarTokenTeamleaderDto
{
    [Column("Correcto")]
    public bool? Correcto { get; set; }

    [Column("Mensaje")]
    public string Mensaje { get; set; } = string.Empty;

    [Column("UsuarioAprobo")]
    public string UsuarioAprobo { get; set; } = string.Empty;
}
