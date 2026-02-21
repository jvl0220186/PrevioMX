using Azure;
using PrevioMX_Api.DTO;
using System.Drawing;

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

    public async Task<CatalogoPaginadoResponse> GetCatalogoProveedoresPaginadosAsync(CatalogoPagiandoRequest request)
    {
        var items = await _context.GetCatalogoProveedoresPaginadoAsync(request);
        int page = request.PageNumber;
        int totalRecords = items.FirstOrDefault()?.TotalRows ?? 0;
        int totalPages = (int)Math.Ceiling(totalRecords / (double)request.PageSize);
        bool more = page < totalPages;

        return new CatalogoPaginadoResponse
        {
            Items = items.Select(r => new CatalogoItemDto
            {
                CValue = r.CValue,
                CText = r.CText
            }).ToList(),
            Page = page,
            Size = request.PageSize,
            TotalRecords = totalRecords,
            TotalPages = totalPages,
            More = more
        };
    }
}

