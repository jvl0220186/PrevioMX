using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class CatalogosResponse
{
    public List<CatalogoItemDto> Items { get; set; } = new();
}

public class CatalogoItemDto
{
    [Column("c_value")]
    public string CValue { get; set; } = string.Empty;
    
    [Column("c_text")]
    public string CText { get; set; } = string.Empty;
}

