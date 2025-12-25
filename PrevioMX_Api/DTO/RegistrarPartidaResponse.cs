using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class RegistrarPartidaResponse
{
    [Column("estatus")]
    public bool Estatus { get; set; }

    [Column("msg")]
    public string Msg { get; set; } = string.Empty;
}

