using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class ValidarClasificacionResponse
{
    [Column("clasificacion")]
    public string Clasificacion { get; set; } = string.Empty;

    [Column("descripcion")]
    public string Descripcion { get; set; } = string.Empty;

    [Column("is_spum")]
    public bool IsSpum { get; set; }

    [Column("sp_um")]
    public string SpUm { get; set; } = string.Empty;

    [Column("is_sppo")]
    public bool IsSppo { get; set; }

    [Column("sp_po")]
    public string SpPo { get; set; } = string.Empty;

    [Column("is_spmms")]
    public bool IsSpmms { get; set; }

    [Column("sp_mms")]
    public string SpMms { get; set; } = string.Empty;

    [Column("sp_cantidades")]
    public string SpCantidades { get; set; } = string.Empty;

    [Column("is_rrmms")]
    public bool IsRrmms { get; set; }
}
