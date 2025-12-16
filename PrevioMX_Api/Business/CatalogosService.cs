using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public class CatalogosService : ICatalogosService
{
    private readonly AuthDbContext _context;
    private readonly ILogger<CatalogosService> _logger;

    public CatalogosService(AuthDbContext context, ILogger<CatalogosService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CatalogosResponse> GetCatalogosAsync(int catalogo)
    {
        var items = await _context.GetCatalogosAsync(catalogo);

        return new CatalogosResponse
        {
            Items = items
        };
    }
}

