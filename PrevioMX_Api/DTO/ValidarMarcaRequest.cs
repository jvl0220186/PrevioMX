using System.ComponentModel.DataAnnotations;

namespace PrevioMX_Api.DTO;

public class ValidarMarcaRequest
{
    public string Referencia { get; set; } = string.Empty;
    public string IdProducto { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
}
