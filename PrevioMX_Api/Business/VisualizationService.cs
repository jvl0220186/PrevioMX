using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public class VisualizationService : IVisualizationService
{
    private readonly AuthDbContext _context;
    private readonly ILogger<VisualizationService> _logger;

    public VisualizationService(AuthDbContext context, ILogger<VisualizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PendientesResponse> GetPendientesAsync()
    {
        var items = await _context.GetPendientesAsync();

        return new PendientesResponse
        {
            Items = items
        };
    }

    public async Task<DetalleEntradaResponse> GetDetalleEntradaAsync(string idEntrada)
    {
        var items = await _context.GetDetalleEntradaAsync(idEntrada);

        return new DetalleEntradaResponse
        {
            Items = items
        };
    }

    public async Task<ValidarCierrePrevioResponse?> GetValidarCierrePrevioAsync(string idEntrada, string idUsuario)
    {
        return await _context.GetValidarCierrePrevioAsync(idEntrada, idUsuario);
    }
}

