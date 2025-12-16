using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public interface IVisualizationService
{
    Task<PendientesResponse> GetPendientesAsync();
    Task<DetalleEntradaResponse> GetDetalleEntradaAsync(string idEntrada);
    Task<ValidarCierrePrevioResponse?> GetValidarCierrePrevioAsync(string idEntrada, string idUsuario);
}

