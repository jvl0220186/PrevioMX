using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public interface IVisualizationService
{
    Task<PendientesResponse> GetPendientesAsync(string equipo);
    Task<DetalleEntradaResponse> GetDetalleEntradaAsync(string idEntrada);
    Task<ValidarCierrePrevioResponse?> GetValidarCierrePrevioAsync(string idEntrada, string idUsuario, bool discrepancia);
    Task<RegistrarPartidaResponse?> RegistrarPartidaAsync(RegistrarPartidaRequest request);
    Task<RegistrarPartidaResponse?> ActualizarPartidaAsync(ActualizarPartidaRequest request);
    Task<RegistrarPartidaResponse?> EliminarPartidaAsync(EliminarPartidaRequest request);
    Task<RegistrarPartidaResponse?> AgregarOpenPOAsync(AgregarOpenPORequest request);
    Task<DetallePOsResponse> GetDetallePOsAsync(string idEntrada);
    Task<ValidarCuarentenasResponse> ValidarCuarentenasAsync(string idEntrada, string idUsuario);
    Task<ValidarMarcaDto?> ValidarMarcaAsync(string referencia, string idProducto, string marcaRegistro);
    Task<ValidarModeloDto?> ValidarModeloAsync(string referencia, string idProducto, string modeloRegistro);
}

