using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public class ClasificacionService : IClasificacionService
{
    private readonly AuthDbContext _context;
    private readonly ILogger<ClasificacionService> _logger;

    public ClasificacionService(AuthDbContext context, ILogger<ClasificacionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ValidarClasificacionResponse?> ValidarClasificacionAsync(string idEntrada, string idProducto)
    {
        _logger.LogInformation("Validando clasificación para Entrada: {IdEntrada}, Producto: {IdProducto}", idEntrada, idProducto);
        
        var result = await _context.GetValidarClasificacionAsync(idEntrada, idProducto);
        
        if (result == null)
        {
            _logger.LogWarning("No se encontró clasificación para Entrada: {IdEntrada}, Producto: {IdProducto}", idEntrada, idProducto);
        }
        
        return result;
    }
}

