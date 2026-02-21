using System.ComponentModel.DataAnnotations.Schema;

namespace PrevioMX_Api.DTO;

public class PendientesResponse
{
    public List<PendienteDto> Items { get; set; } = new();
}

public class PendienteDto
{
    [Column("id_entrada")]
    public string IdEntrada { get; set; } = string.Empty;

    [Column("id_bodega")]
    public string IdBodega { get; set; } = string.Empty;

    [Column("bodega")]
    public string Bodega { get; set; } = string.Empty;

    [Column("id_cliente")]
    public string IdCliente { get; set; } = string.Empty;

    [Column("cliente")]
    public string Cliente { get; set; } = string.Empty;

    [Column("id_proveedor")]
    public string IdProveedor { get; set; } = string.Empty;

    [Column("proveedor")]
    public string Proveedor { get; set; } = string.Empty;

    [Column("fecha_entrada")]
    public DateTime FechaEntrada { get; set; }

    [Column("fecha_previo")]
    public DateTime? FechaPrevio { get; set; }

    [Column("bultos")]
    public int Bultos { get; set; }

    [Column("tipo_envio")]
    public string TipoEnvio { get; set; } = string.Empty;

    [Column("estatus")]
    public string Estatus { get; set; } = string.Empty;

    [Column("tipo_captura")]
    public string TipoCaptura { get; set; } = string.Empty;

    [Column("fecha_documento")]
    public DateTime? FechaDocumento { get; set; }

    //[Column("ruta_documento")]
    //public string? RutaDocumento { get; set; }
    public List<PendienteDocumentosResponseDto> Documentos { get; set; } = new();

    [Column("es_openpo")]
    public bool EsOpenpo { get; set; }
}

