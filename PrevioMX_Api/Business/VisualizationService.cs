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

    public async Task<PendientesResponse> GetPendientesAsync(string equipo)
    {
        var items = await _context.GetPendientesAsync(equipo);

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

    public async Task<ValidarCierrePrevioResponse?> GetValidarCierrePrevioAsync(string idEntrada, string idUsuario, bool discrepancia)
    {
        return await _context.GetValidarCierrePrevioAsync(idEntrada, idUsuario, discrepancia);
    }

    public async Task<RegistrarPartidaResponse?> RegistrarPartidaAsync(RegistrarPartidaRequest request)
    {
        _logger.LogInformation("Registrando partida para bulto: {IdBulto}, producto: {IdProducto}", 
            request.IdBulto, request.IdProducto);
        
        return await _context.RegistrarPartidaAsync(request);
    }

    public async Task<RegistrarPartidaResponse?> ActualizarPartidaAsync(ActualizarPartidaRequest request)
    {
        _logger.LogInformation("Actualizando partida Id: {Id}, bulto: {IdBulto}, producto: {IdProducto}", 
            request.Id, request.IdBulto, request.IdProducto);
        
        return await _context.ActualizarPartidaAsync(request);
    }

    public async Task<DetallePOsResponse> GetDetallePOsAsync(string idEntrada)
    {
        var items = await _context.GetDetallePOsAsync(idEntrada);

        return new DetallePOsResponse
        {
            Items = items
        };
    }

    public async Task<ValidarCuarentenasResponse> ValidarCuarentenasAsync(string idEntrada, string idUsuario)
    {
        _logger.LogInformation("Validando cuarentenas para entrada: {IdEntrada}, usuario: {IdUsuario}", 
            idEntrada, idUsuario);
        
        return await _context.ValidarCuarentenasAsync(idEntrada, idUsuario);
    }

    public async Task<ValidarMarcaDto?> ValidarMarcaAsync(string referencia, string idProducto, string marcaRegistro)
    {
        _logger.LogInformation("Validando marca para referencia: {Referencia}, producto: {IdProducto}, marca: {Marca}", 
            referencia, idProducto, marcaRegistro);
        
        return await _context.ValidarMarcaAsync(referencia, idProducto, marcaRegistro);
    }

    public async Task<ValidarModeloDto?> ValidarModeloAsync(string referencia, string idProducto, string modeloRegistro)
    {
        _logger.LogInformation("Validando modelo para referencia: {Referencia}, producto: {IdProducto}, modelo: {Modelo}", 
            referencia, idProducto, modeloRegistro);
        
        return await _context.ValidarModeloAsync(referencia, idProducto, modeloRegistro);
    }

    public async Task<RegistrarPartidaResponse?> EliminarPartidaAsync(EliminarPartidaRequest request)
    {
        _logger.LogInformation("Eliminando partida para bulto: {IdBulto}, referencia: {Referencia}, producto: {IdProducto}", 
            request.IdBulto, request.Referencia, request.IdProducto);
        
        return await _context.EliminarPartidaAsync(request);
    }

    public async Task<RegistrarPartidaResponse?> AgregarOpenPOAsync(AgregarOpenPORequest request)
    {
        _logger.LogInformation("Agregando Open PO - Referencia: {Referencia}, PO: {Po}, Packing: {Packing}", 
            request.Referencia, request.Po, request.Packing);
        
        return await _context.AgregarOpenPOAsync(request);
    }
}

