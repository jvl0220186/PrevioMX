using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class ValidarModeloDto
{
    [Column("Valido")]
    public bool Valido { get; set; }
}
