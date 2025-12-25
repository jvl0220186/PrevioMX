using PrevioMX_Api.DTO;

namespace PrevioMX_Api.Business;

public interface IClasificacionService
{
    Task<ValidarClasificacionResponse?> ValidarClasificacionAsync(string idEntrada, string idProducto);
}

