using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class ValidarCuarentenasResponse
{
    public bool Success { get; set; }
    public List<ValidarCuarentenasItemDto> Items { get; set; } = new();
}

public class ValidarCuarentenasItemDto
{
    [Column("EXITO")]
    public bool Exito { get; set; }

    [Column("MENSAJE")]
    public string Mensaje { get; set; } = string.Empty;
}

