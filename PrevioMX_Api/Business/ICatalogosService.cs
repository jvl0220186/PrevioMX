using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public interface ICatalogosService
{
    Task<CatalogosResponse> GetCatalogosAsync(int catalogo);
}

