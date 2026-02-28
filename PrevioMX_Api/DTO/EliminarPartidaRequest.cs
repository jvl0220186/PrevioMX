namespace PrevioMX_Api.DTO;

public class EliminarPartidaRequest
{
    public int Id { get; set; }
    public string IdBulto { get; set; } = string.Empty;
    public string Referencia { get; set; } = string.Empty;
    public string IdProducto { get; set; } = string.Empty;
}
