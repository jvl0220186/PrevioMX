using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class ValidarCierrePrevioResponse
{
    [Column("estatus")]
    public bool Estatus { get; set; }

    [Column("bultos_totales")]
    public int BultosTotales { get; set; }

    [Column("bultos_previo")]
    public int BultosPrevio { get; set; }

    [Column("msg")]
    public string Msg { get; set; } = string.Empty;
}

