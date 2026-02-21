namespace PrevioMX_Api.DTO;

public class ActualizarPartidaRequest
{
    public int Id { get; set; }
    public string IdBulto { get; set; } = string.Empty;
    public string Referencia { get; set; } = string.Empty;
    public string IdProveedor { get; set; } = string.Empty;
    public string IdProducto { get; set; } = string.Empty;
    public string UM { get; set; } = string.Empty;
    public string Cantidad { get; set; } = string.Empty;
    public string SubCantidad { get; set; } = string.Empty;
    public string PaisOrigen { get; set; } = string.Empty;
    public string Comentarios { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string OcCompra { get; set; } = string.Empty;
    public string NoParteFisico { get; set; } = string.Empty;
    public string Mms { get; set; } = string.Empty;
}

