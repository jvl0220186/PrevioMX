using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class DetallePOsResponse
{
    public List<DetallePODto> Items { get; set; } = new();
}

public class DetallePODto
{
    [Column("po")]
    public string Po { get; set; } = string.Empty;

    [Column("bultos")]
    public int Bultos { get; set; }

    [Column("id_producto")]
    public string IdProducto { get; set; } = string.Empty;

    [Column("cantidad")]
    public decimal Cantidad { get; set; }

    [Column("descripcion")]
    public string Descripcion { get; set; } = string.Empty;

    [Column("pais_origen")]
    public string PaisOrigen { get; set; } = string.Empty;

    [Column("um")]
    public string Um { get; set; } = string.Empty;
}

