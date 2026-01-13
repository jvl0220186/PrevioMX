using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class ValidarMarcaDto
{
    [Column("Valido")]
    public bool Valido { get; set; }
}
