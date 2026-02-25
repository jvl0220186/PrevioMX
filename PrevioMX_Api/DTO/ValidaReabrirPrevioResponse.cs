namespace PrevioMX_Api.DTO
{
    public class ValidaReabrirPrevioResponse
    {
        public string Usuario { get; set; } = string.Empty;
        public string LUsuario { get; set; } = string.Empty;
        public bool PuedeRegenerar { get; set; }
    }
}
