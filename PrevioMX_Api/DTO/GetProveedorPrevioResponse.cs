using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class GetProveedorPrevioResponse
{
    [Column("idProveedor")]
    public string? IdProveedor { get; set; }

    [Column("proveedor")]
    public string? Proveedor { get; set; }

    [Column("estatus")]
    public bool Estatus { get; set; }

    [Column("msg")]
    public string Msg { get; set; } = string.Empty;
}
