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

public class CatalogoPagiandoRequest
{
    public string Filtro { get; set; } = string.Empty;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CatalogoPaginadoDto : CatalogoItemDto
{
    public int TotalRows { get; set; }
}

public class CatalogoPaginadoResponse
{
    public List<CatalogoItemDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int Size { get; set; }
    public int TotalRecords { get; set; }
    public int TotalPages { get; set; }
    public bool More { get; set; }
}