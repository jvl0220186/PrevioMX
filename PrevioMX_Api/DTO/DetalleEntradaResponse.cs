using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class DetalleEntradaResponse
{
    public List<DetalleEntradaDto> Items { get; set; } = new();
}

public class DetalleEntradaDto
{
    [Column("id_entrada")]
    public string IdEntrada { get; set; } = string.Empty;

    [Column("id_bulto")]
    public string? IdBulto { get; set; }

    [Column("id")]
    public string? Id { get; set; }

    [Column("id_producto")]
    public string? IdProducto { get; set; }

    [Column("oc_compra")]
    public string? OcCompra { get; set; }

    [Column("um")]
    public string? Um { get; set; }

    [Column("pais_origen")]
    public string? PaisOrigen { get; set; }

    [Column("discrepancia")]
    public bool? Discrepancia { get; set; }

    [Column("cantidad")]
    public string? Cantidad { get; set; }

    [Column("cantidad_cartones")]
    public string? CantidadCartones { get; set; }

    [Column("precio_unitario")]
    public double? PrecioUnitario { get; set; }

    [Column("comentarios")]
    public string? Comentarios { get; set; }

    [Column("clasificado")]
    public bool? Clasificado { get; set; }

    [Column("series")]
    public bool? Series { get; set; }
}

