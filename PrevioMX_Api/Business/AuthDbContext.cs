using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PrevioMX_Api.DTO;
using PrevioMX_Api.Models;

namespace PrevioMX_Api.Business;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    // DbSet necesario para mapear resultados de stored procedures
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuración mínima del modelo para mapear resultados de stored procedures
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
        });
    }

    // Métodos para ejecutar stored procedures

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_Login para autenticar un usuario
    /// </summary>
    public async Task<LoginResultDto?> LoginAsync(string usuario, string password)
    {
        var parameters = new[]
        {
            new SqlParameter("@P_USUARIO", usuario),
            new SqlParameter("@P_PASSWORD", password)
        };

        // Usar Database.SqlQueryRaw para mapear el resultado a LoginResultDto
        var result = await Database
            .SqlQueryRaw<LoginResultDto>("EXEC CSP_PMX_Login @P_USUARIO, @P_PASSWORD", parameters)
            .ToListAsync();
        
        return result.FirstOrDefault();
    }

    /// <summary>
    /// Registra un nuevo usuario usando stored procedure
    /// </summary>
    public async Task<User?> RegisterUserAsync(string email, string name, string passwordHash, string refreshToken, DateTime refreshTokenExpiryTime)
    {
        var parameters = new[]
        {
            new SqlParameter("@Email", email),
            new SqlParameter("@Name", name),
            new SqlParameter("@PasswordHash", passwordHash),
            new SqlParameter("@RefreshToken", refreshToken),
            new SqlParameter("@RefreshTokenExpiryTime", refreshTokenExpiryTime),
            new SqlParameter("@CreatedAt", DateTime.UtcNow)
        };

        var users = await Users
            .FromSqlRaw("EXEC sp_RegisterUser @Email, @Name, @PasswordHash, @RefreshToken, @RefreshTokenExpiryTime, @CreatedAt", parameters)
            .AsNoTracking()
            .ToListAsync();
        
        return users.FirstOrDefault();
    }

    /// <summary>
    /// Actualiza el refresh token de un usuario usando stored procedure
    /// </summary>
    public async Task<bool> UpdateRefreshTokenAsync(int userId, string refreshToken, DateTime refreshTokenExpiryTime)
    {
        var parameters = new[]
        {
            new SqlParameter("@UserId", userId),
            new SqlParameter("@RefreshToken", refreshToken),
            new SqlParameter("@RefreshTokenExpiryTime", refreshTokenExpiryTime),
            new SqlParameter("@UpdatedAt", DateTime.UtcNow)
        };

        var result = await Database
            .ExecuteSqlRawAsync("EXEC sp_UpdateRefreshToken @UserId, @RefreshToken, @RefreshTokenExpiryTime, @UpdatedAt", parameters);
        
        return result > 0;
    }

    /// <summary>
    /// Busca un usuario por refresh token usando stored procedure
    /// </summary>
    public async Task<User?> GetUserByRefreshTokenAsync(string refreshToken)
    {
        var refreshTokenParam = new SqlParameter("@RefreshToken", refreshToken);
        
        var users = await Users
            .FromSqlRaw("EXEC sp_GetUserByRefreshToken @RefreshToken", refreshTokenParam)
            .AsNoTracking()
            .ToListAsync();
        
        return users.FirstOrDefault();
    }

    /// <summary>
    /// Verifica si un email ya existe usando stored procedure
    /// </summary>
    public async Task<bool> EmailExistsAsync(string email)
    {
        var emailParam = new SqlParameter("@Email", email);
        var resultParam = new SqlParameter("@Result", System.Data.SqlDbType.Bit)
        {
            Direction = System.Data.ParameterDirection.Output
        };

        await Database
            .ExecuteSqlRawAsync("EXEC sp_EmailExists @Email, @Result OUTPUT", emailParam, resultParam);
        
        return (bool)(resultParam.Value ?? false);
    }

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_Catalogos para obtener catálogos
    /// </summary>
    public async Task<List<CatalogoItemDto>> GetCatalogosAsync(int catalogo)
    {
        var parameter = new SqlParameter("@P_CATALOGO", catalogo);

        var result = await Database
            .SqlQueryRaw<CatalogoItemDto>("EXEC CSP_PMX_Catalogos @P_CATALOGO", parameter)
            .ToListAsync();
        
        return result;
    }

    /// <summary>
    /// Recuepración de proveedores paginados usando el stored procedure csp_PMX_ProveedoresListarPaginado
    /// </summary>
    /// <param name="request">Datos del filtro páginado</param>
    /// <returns></returns>
    public async Task<List<CatalogoPaginadoDto>> GetCatalogoProveedoresPaginadoAsync(CatalogoPagiandoRequest request)
    {
        var paramFiltro = new SqlParameter("@Filtro", request.Filtro);
        var paramPageNumber = new SqlParameter("@PageNumber", request.PageNumber);
        var paramPageSize = new SqlParameter("@PageSize", request.PageSize);

        var result = await Database
            .SqlQueryRaw<CatalogoPaginadoDto>("EXEC csp_PMX_ProveedoresListarPaginado @Filtro, @PageNumber, @PageSize", paramFiltro, paramPageNumber, paramPageSize)
            .ToListAsync();

        return result;
    }

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_ObtenerPendientes para obtener pendientes
    /// </summary>
    public async Task<List<PendienteDto>> GetPendientesAsync(string equipo)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_ObtenerPendientes @EQUIPO = @EQUIPO";
            command.CommandType = System.Data.CommandType.Text;

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@EQUIPO";
            parameter.Value = equipo;
            command.Parameters.Add(parameter);

            using var reader = await command.ExecuteReaderAsync();
            var results = new List<PendienteDto>();

            while (await reader.ReadAsync())
            {
                string docs = reader["ruta_documento"]?.ToString() ?? "";
                List<PendienteDocumentosResponseDto> documentos = new List<PendienteDocumentosResponseDto>();
                var docsArray = docs.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries);
                if (docsArray.Length > 0)
                {
                    documentos = docsArray.Select(d => new PendienteDocumentosResponseDto
                    {
                        Documento = UrlFileServices.ExtracFileNameFromUrl(d),
                        RutaDocumento = d
                    }).ToList();
                }

                var item = new PendienteDto
                {
                    IdEntrada = reader["id_entrada"]?.ToString() ?? string.Empty,
                    IdBodega = reader["id_bodega"]?.ToString() ?? string.Empty,
                    Bodega = reader["bodega"]?.ToString() ?? string.Empty,
                    IdCliente = reader["id_cliente"]?.ToString() ?? string.Empty,
                    Cliente = reader["cliente"]?.ToString() ?? string.Empty,
                    IdProveedor = reader["id_proveedor"]?.ToString() ?? string.Empty,
                    Proveedor = reader["proveedor"]?.ToString() ?? string.Empty,
                    FechaEntrada = reader["fecha_entrada"] != DBNull.Value ? Convert.ToDateTime(reader["fecha_entrada"]) : DateTime.MinValue,
                    FechaPrevio = reader["fecha_previo"] != DBNull.Value ? Convert.ToDateTime(reader["fecha_previo"]) : null,
                    Bultos = reader["bultos"] != DBNull.Value ? Convert.ToInt32(reader["bultos"]) : 0,
                    TipoEnvio = reader["tipo_envio"]?.ToString() ?? string.Empty,
                    Estatus = reader["estatus"]?.ToString() ?? string.Empty,
                    TipoCaptura = reader["tipo_captura"]?.ToString() ?? string.Empty,
                    FechaDocumento = reader["fecha_documento"] != DBNull.Value ? Convert.ToDateTime(reader["fecha_documento"]) : null,
                    //RutaDocumento = reader["ruta_documento"]?.ToString(),
                    Documentos = documentos,
                    EsOpenpo = reader["es_openpo"] != DBNull.Value && Convert.ToBoolean(reader["es_openpo"])
                };

                results.Add(item);
            }

            return results;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_DetalleEntrada para obtener el detalle de una entrada
    /// </summary>
    public async Task<List<DetalleEntradaDto>> GetDetalleEntradaAsync(string idEntrada)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_DetalleEntrada @ID_ENTRADA = @ID_ENTRADA";
            command.CommandType = System.Data.CommandType.Text;

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@ID_ENTRADA";
            parameter.Value = idEntrada;
            command.Parameters.Add(parameter);

            using var reader = await command.ExecuteReaderAsync();
            var results = new List<DetalleEntradaDto>();

            while (await reader.ReadAsync())
            {
                var item = new DetalleEntradaDto
                {
                    IdEntrada = reader["id_entrada"]?.ToString() ?? string.Empty,
                    IdBulto = reader["id_bulto"]?.ToString(),
                    Id = reader["id"]?.ToString(),
                    IdProducto = reader["id_producto"]?.ToString(),
                    OcCompra = reader["oc_compra"]?.ToString(),
                    Um = reader["um"]?.ToString(),
                    PaisOrigen = reader["pais_origen"]?.ToString(),
                    Discrepancia = reader["discrepancia"] != DBNull.Value ? Convert.ToBoolean(reader["discrepancia"]) : null,
                    Cantidad = reader["cantidad"]?.ToString(),
                    CantidadCartones = reader["cantidad_cartones"]?.ToString(),
                    PrecioUnitario = reader["precio_unitario"] != DBNull.Value ? Convert.ToDouble(reader["precio_unitario"]) : null,
                    Comentarios = reader["comentarios"]?.ToString(),
                    Clasificado = reader["clasificado"] != DBNull.Value ? Convert.ToBoolean(reader["clasificado"]) : null,
                    Series = reader["series"] != DBNull.Value ? Convert.ToBoolean(reader["series"]) : null,
                    EsOpenPO = reader["EsOpenPO"] != DBNull.Value && Convert.ToBoolean(reader["EsOpenPO"]),
                    DescripcionClas = reader["descripcion_clas"]?.ToString(),
                    Mms = reader["MMS"]?.ToString()
                };

                results.Add(item);
            }

            return results;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_ValidarCierrePrevio para validar el cierre de previo
    /// </summary>
    public async Task<ValidarCierrePrevioResponse?> GetValidarCierrePrevioAsync(string idEntrada, string idUsuario, bool discrepancia)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_ValidarCierrePrevio @ID_ENTRADA = @ID_ENTRADA, @ID_USUARIO = @ID_USUARIO, @DISCREPANCIA = @DISCREPANCIA";
            command.CommandType = System.Data.CommandType.Text;

            var parameterEntrada = command.CreateParameter();
            parameterEntrada.ParameterName = "@ID_ENTRADA";
            parameterEntrada.Value = idEntrada;
            command.Parameters.Add(parameterEntrada);

            var parameterUsuario = command.CreateParameter();
            parameterUsuario.ParameterName = "@ID_USUARIO";
            parameterUsuario.Value = idUsuario;
            command.Parameters.Add(parameterUsuario);

            var parameterDiscrepancia = command.CreateParameter();
            parameterDiscrepancia.ParameterName = "@DISCREPANCIA";
            parameterDiscrepancia.Value = discrepancia;
            command.Parameters.Add(parameterDiscrepancia);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new ValidarCierrePrevioResponse
                {
                    Estatus = reader["estatus"] != DBNull.Value && Convert.ToBoolean(reader["estatus"]),
                    BultosTotales = reader["bultos_totales"] != DBNull.Value ? Convert.ToInt32(reader["bultos_totales"]) : 0,
                    BultosPrevio = reader["bultos_previo"] != DBNull.Value ? Convert.ToInt32(reader["bultos_previo"]) : 0,
                    Msg = reader["msg"]?.ToString() ?? string.Empty
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_ValidarClasificacion para validar la clasificación de un producto
    /// </summary>
    public async Task<ValidarClasificacionResponse?> GetValidarClasificacionAsync(string idEntrada, string idProducto)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_ValidarClasificacion @ID_ENTRADA = @ID_ENTRADA, @ID_PRODUCTO = @ID_PRODUCTO";
            command.CommandType = System.Data.CommandType.Text;

            var parameterEntrada = command.CreateParameter();
            parameterEntrada.ParameterName = "@ID_ENTRADA";
            parameterEntrada.Value = idEntrada;
            command.Parameters.Add(parameterEntrada);

            var parameterProducto = command.CreateParameter();
            parameterProducto.ParameterName = "@ID_PRODUCTO";
            parameterProducto.Value = idProducto;
            command.Parameters.Add(parameterProducto);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new ValidarClasificacionResponse
                {
                    Clasificacion = reader["clasificacion"]?.ToString() ?? string.Empty,
                    Descripcion = reader["descripcion"]?.ToString() ?? string.Empty,
                    IsSpum = reader["is_spum"] != DBNull.Value && Convert.ToBoolean(reader["is_spum"]),
                    SpUm = reader["sp_um"]?.ToString() ?? string.Empty,
                    IsSppo = reader["is_sppo"] != DBNull.Value && Convert.ToBoolean(reader["is_sppo"]),
                    SpPo = reader["sp_po"]?.ToString() ?? string.Empty,
                    IsSpmms = reader["is_spmms"] != DBNull.Value && Convert.ToBoolean(reader["is_spmms"]),
                    SpMms = reader["sp_mms"]?.ToString() ?? string.Empty,
                    SpCantidades = reader["sp_cantidades"]?.ToString() ?? string.Empty
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure csp_PMX_RegistrarPartida para registrar una partida
    /// </summary>
    public async Task<RegistrarPartidaResponse?> RegistrarPartidaAsync(RegistrarPartidaRequest request)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"EXEC csp_PMX_RegistrarPartida 
                @idbulto = @idbulto, 
                @Referencia = @Referencia, 
                @id_proveedor = @id_proveedor, 
                @id_producto = @id_producto, 
                @UM = @UM, 
                @cantidad = @cantidad, 
                @sub_cantidad = @sub_cantidad, 
                @pais_origen = @pais_origen, 
                @Comentarios = @Comentarios, 
                @Usuario = @Usuario, 
                @oc_compra = @oc_compra,
                @noparte_fisico = @noparte_fisico,
                @mms = @mms";
            command.CommandType = System.Data.CommandType.Text;

            var paramIdBulto = command.CreateParameter();
            paramIdBulto.ParameterName = "@idbulto";
            paramIdBulto.Value = request.IdBulto;
            command.Parameters.Add(paramIdBulto);

            var paramReferencia = command.CreateParameter();
            paramReferencia.ParameterName = "@Referencia";
            paramReferencia.Value = request.Referencia;
            command.Parameters.Add(paramReferencia);

            var paramIdProveedor = command.CreateParameter();
            paramIdProveedor.ParameterName = "@id_proveedor";
            paramIdProveedor.Value = request.IdProveedor;
            command.Parameters.Add(paramIdProveedor);

            var paramIdProducto = command.CreateParameter();
            paramIdProducto.ParameterName = "@id_producto";
            paramIdProducto.Value = request.IdProducto;
            command.Parameters.Add(paramIdProducto);

            var paramUM = command.CreateParameter();
            paramUM.ParameterName = "@UM";
            paramUM.Value = request.UM;
            command.Parameters.Add(paramUM);

            var paramCantidad = command.CreateParameter();
            paramCantidad.ParameterName = "@cantidad";
            paramCantidad.Value = request.Cantidad;
            command.Parameters.Add(paramCantidad);

            var paramSubCantidad = command.CreateParameter();
            paramSubCantidad.ParameterName = "@sub_cantidad";
            paramSubCantidad.Value = request.SubCantidad;
            command.Parameters.Add(paramSubCantidad);

            var paramPaisOrigen = command.CreateParameter();
            paramPaisOrigen.ParameterName = "@pais_origen";
            paramPaisOrigen.Value = request.PaisOrigen;
            command.Parameters.Add(paramPaisOrigen);

            var paramComentarios = command.CreateParameter();
            paramComentarios.ParameterName = "@Comentarios";
            paramComentarios.Value = request.Comentarios;
            command.Parameters.Add(paramComentarios);

            var paramUsuario = command.CreateParameter();
            paramUsuario.ParameterName = "@Usuario";
            paramUsuario.Value = request.Usuario;
            command.Parameters.Add(paramUsuario);

            var paramOcCompra = command.CreateParameter();
            paramOcCompra.ParameterName = "@oc_compra";
            paramOcCompra.Value = request.OcCompra;
            command.Parameters.Add(paramOcCompra);

            var paramNoParteFisico = command.CreateParameter();
            paramNoParteFisico.ParameterName = "@noparte_fisico";
            paramNoParteFisico.Value = request.NoParteFisico;
            command.Parameters.Add(paramNoParteFisico);

            var paramMms = command.CreateParameter();
            paramMms.ParameterName = "@mms";
            paramMms.Value = request.Mms;
            command.Parameters.Add(paramMms);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new RegistrarPartidaResponse
                {
                    Estatus = reader["estatus"] != DBNull.Value && Convert.ToBoolean(reader["estatus"]),
                    Msg = reader["msg"]?.ToString() ?? string.Empty
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_DetallePOs para obtener el detalle de POs de una entrada
    /// </summary>
    public async Task<List<DetallePODto>> GetDetallePOsAsync(string idEntrada)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_DetallePOs @ID_ENTRADA = @ID_ENTRADA";
            command.CommandType = System.Data.CommandType.Text;

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@ID_ENTRADA";
            parameter.Value = idEntrada;
            command.Parameters.Add(parameter);

            using var reader = await command.ExecuteReaderAsync();
            var results = new List<DetallePODto>();

            while (await reader.ReadAsync())
            {
                var item = new DetallePODto
                {
                    Po = reader["po"]?.ToString() ?? string.Empty,
                    Bultos = reader["bultos"] != DBNull.Value ? Convert.ToInt32(reader["bultos"]) : 0,
                    IdProducto = reader["id_producto"]?.ToString() ?? string.Empty,
                    Cantidad = reader["cantidad"] != DBNull.Value ? Convert.ToDecimal(reader["cantidad"]) : 0,
                    Descripcion = reader["descripcion"]?.ToString() ?? string.Empty,
                    PaisOrigen = reader["pais_origen"]?.ToString() ?? string.Empty,
                    Um = reader["um"]?.ToString() ?? string.Empty
                };

                results.Add(item);
            }

            return results;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure csp_PMX_ActualizarPartida para actualizar una partida existente
    /// </summary>
    public async Task<RegistrarPartidaResponse?> ActualizarPartidaAsync(ActualizarPartidaRequest request)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"EXEC csp_PMX_ActualizarPartida 
                @id = @id,
                @idbulto = @idbulto, 
                @Referencia = @Referencia, 
                @id_proveedor = @id_proveedor,
                @id_producto = @id_producto, 
                @UM = @UM, 
                @cantidad = @cantidad, 
                @sub_cantidad = @sub_cantidad, 
                @pais_origen = @pais_origen, 
                @Comentarios = @Comentarios, 
                @Usuario = @Usuario, 
                @oc_compra = @oc_compra,
                @noparte_fisico = @noparte_fisico,
                @mms = @mms";
            command.CommandType = System.Data.CommandType.Text;

            var paramId = command.CreateParameter();
            paramId.ParameterName = "@id";
            paramId.Value = request.Id;
            command.Parameters.Add(paramId);

            var paramIdBulto = command.CreateParameter();
            paramIdBulto.ParameterName = "@idbulto";
            paramIdBulto.Value = request.IdBulto;
            command.Parameters.Add(paramIdBulto);

            var paramReferencia = command.CreateParameter();
            paramReferencia.ParameterName = "@Referencia";
            paramReferencia.Value = request.Referencia;
            command.Parameters.Add(paramReferencia);

            var paramIdProveedor = command.CreateParameter();
            paramIdProveedor.ParameterName = "@id_proveedor";
            paramIdProveedor.Value = request.IdProveedor;
            command.Parameters.Add(paramIdProveedor);

            var paramIdProducto = command.CreateParameter();
            paramIdProducto.ParameterName = "@id_producto";
            paramIdProducto.Value = request.IdProducto;
            command.Parameters.Add(paramIdProducto);

            var paramUM = command.CreateParameter();
            paramUM.ParameterName = "@UM";
            paramUM.Value = request.UM;
            command.Parameters.Add(paramUM);

            var paramCantidad = command.CreateParameter();
            paramCantidad.ParameterName = "@cantidad";
            paramCantidad.Value = request.Cantidad;
            command.Parameters.Add(paramCantidad);

            var paramSubCantidad = command.CreateParameter();
            paramSubCantidad.ParameterName = "@sub_cantidad";
            paramSubCantidad.Value = request.SubCantidad;
            command.Parameters.Add(paramSubCantidad);

            var paramPaisOrigen = command.CreateParameter();
            paramPaisOrigen.ParameterName = "@pais_origen";
            paramPaisOrigen.Value = request.PaisOrigen;
            command.Parameters.Add(paramPaisOrigen);

            var paramComentarios = command.CreateParameter();
            paramComentarios.ParameterName = "@Comentarios";
            paramComentarios.Value = request.Comentarios;
            command.Parameters.Add(paramComentarios);

            var paramUsuario = command.CreateParameter();
            paramUsuario.ParameterName = "@Usuario";
            paramUsuario.Value = request.Usuario;
            command.Parameters.Add(paramUsuario);

            var paramOcCompra = command.CreateParameter();
            paramOcCompra.ParameterName = "@oc_compra";
            paramOcCompra.Value = request.OcCompra;
            command.Parameters.Add(paramOcCompra);

            var paramNoParteFisico = command.CreateParameter();
            paramNoParteFisico.ParameterName = "@noparte_fisico";
            paramNoParteFisico.Value = request.NoParteFisico;
            command.Parameters.Add(paramNoParteFisico);

            var paramMms = command.CreateParameter();
            paramMms.ParameterName = "@mms";
            paramMms.Value = request.Mms;
            command.Parameters.Add(paramMms);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new RegistrarPartidaResponse
                {
                    Estatus = reader["estatus"] != DBNull.Value && Convert.ToBoolean(reader["estatus"]),
                    Msg = reader["msg"]?.ToString() ?? string.Empty
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure CSP_PMX_ValidarCuarentenas para validar cuarentenas de una entrada
    /// </summary>
    public async Task<ValidarCuarentenasResponse> ValidarCuarentenasAsync(string idEntrada, string idUsuario)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_ValidarCuarentenas @ID_ENTRADA = @ID_ENTRADA, @ID_USUARIO = @ID_USUARIO";
            command.CommandType = System.Data.CommandType.Text;

            var parameterEntrada = command.CreateParameter();
            parameterEntrada.ParameterName = "@ID_ENTRADA";
            parameterEntrada.Value = idEntrada;
            command.Parameters.Add(parameterEntrada);

            var parameterUsuario = command.CreateParameter();
            parameterUsuario.ParameterName = "@ID_USUARIO";
            parameterUsuario.Value = idUsuario;
            command.Parameters.Add(parameterUsuario);

            using var reader = await command.ExecuteReaderAsync();
            var results = new List<ValidarCuarentenasItemDto>();

            while (await reader.ReadAsync())
            {
                var item = new ValidarCuarentenasItemDto
                {
                    Exito = reader["EXITO"] != DBNull.Value && Convert.ToBoolean(reader["EXITO"]),
                    Mensaje = reader["MENSAJE"]?.ToString() ?? string.Empty
                };
                results.Add(item);
            }

            return new ValidarCuarentenasResponse
            {
                Success = results.Count > 0 && results.All(x => x.Exito),
                Items = results
            };
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure SP_FEA_ValidarTokenTeamleader_Result para validar el token de un teamleader
    /// </summary>
    public async Task<ValidarTokenTeamleaderDto?> ValidarTokenTeamleaderAsync(string usuario, string token)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC SP_FEA_ValidarTokenTeamleader_Result @usuario = @usuario, @token = @token";
            command.CommandType = System.Data.CommandType.Text;

            var paramUsuario = command.CreateParameter();
            paramUsuario.ParameterName = "@usuario";
            paramUsuario.Value = usuario ?? (object)DBNull.Value;
            command.Parameters.Add(paramUsuario);

            var paramToken = command.CreateParameter();
            paramToken.ParameterName = "@token";
            paramToken.Value = token ?? (object)DBNull.Value;
            command.Parameters.Add(paramToken);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new ValidarTokenTeamleaderDto
                {
                    Correcto = reader["Correcto"] != DBNull.Value ? (bool?)Convert.ToBoolean(reader["Correcto"]) : null,
                    Mensaje = reader["Mensaje"]?.ToString() ?? string.Empty,
                    UsuarioAprobo = reader["UsuarioAprobo"]?.ToString() ?? string.Empty
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure csp_PMX_ValidaMarca para validar la marca de un producto
    /// </summary>
    public async Task<ValidarMarcaDto?> ValidarMarcaAsync(string referencia, string idProducto, string marcaRegistro)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC csp_PMX_ValidaMarca @Referencia = @Referencia, @id_producto = @id_producto, @marca_registro = @marca_registro";
            command.CommandType = System.Data.CommandType.Text;

            var paramReferencia = command.CreateParameter();
            paramReferencia.ParameterName = "@Referencia";
            paramReferencia.Value = referencia;
            command.Parameters.Add(paramReferencia);

            var paramIdProducto = command.CreateParameter();
            paramIdProducto.ParameterName = "@id_producto";
            paramIdProducto.Value = idProducto;
            command.Parameters.Add(paramIdProducto);

            var paramMarcaRegistro = command.CreateParameter();
            paramMarcaRegistro.ParameterName = "@marca_registro";
            paramMarcaRegistro.Value = marcaRegistro;
            command.Parameters.Add(paramMarcaRegistro);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new ValidarMarcaDto
                {
                    Valido = reader["Valido"] != DBNull.Value && Convert.ToBoolean(reader["Valido"])
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure csp_PMX_ValidaModelo para validar el modelo de un producto
    /// </summary>
    public async Task<ValidarModeloDto?> ValidarModeloAsync(string referencia, string idProducto, string modeloRegistro)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC csp_PMX_ValidaModelo @Referencia = @Referencia, @id_producto = @id_producto, @modelo_registro = @modelo_registro";
            command.CommandType = System.Data.CommandType.Text;

            var paramReferencia = command.CreateParameter();
            paramReferencia.ParameterName = "@Referencia";
            paramReferencia.Value = referencia;
            command.Parameters.Add(paramReferencia);

            var paramIdProducto = command.CreateParameter();
            paramIdProducto.ParameterName = "@id_producto";
            paramIdProducto.Value = idProducto;
            command.Parameters.Add(paramIdProducto);

            var paramModeloRegistro = command.CreateParameter();
            paramModeloRegistro.ParameterName = "@modelo_registro";
            paramModeloRegistro.Value = modeloRegistro;
            command.Parameters.Add(paramModeloRegistro);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new ValidarModeloDto
                {
                    Valido = reader["Valido"] != DBNull.Value && Convert.ToBoolean(reader["Valido"])
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure csp_PMX_EliminarPartida para eliminar una partida
    /// </summary>
    public async Task<RegistrarPartidaResponse?> EliminarPartidaAsync(EliminarPartidaRequest request)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"EXEC csp_PMX_EliminarPartida 
                @idbulto = @idbulto, 
                @Referencia = @Referencia, 
                @id_producto = @id_producto";
            command.CommandType = System.Data.CommandType.Text;

            var paramIdBulto = command.CreateParameter();
            paramIdBulto.ParameterName = "@idbulto";
            paramIdBulto.Value = request.IdBulto;
            command.Parameters.Add(paramIdBulto);

            var paramReferencia = command.CreateParameter();
            paramReferencia.ParameterName = "@Referencia";
            paramReferencia.Value = request.Referencia;
            command.Parameters.Add(paramReferencia);

            var paramIdProducto = command.CreateParameter();
            paramIdProducto.ParameterName = "@id_producto";
            paramIdProducto.Value = request.IdProducto;
            command.Parameters.Add(paramIdProducto);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new RegistrarPartidaResponse
                {
                    Estatus = reader["estatus"] != DBNull.Value && Convert.ToBoolean(reader["estatus"]),
                    Msg = reader["msg"]?.ToString() ?? string.Empty
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Ejecuta el stored procedure csp_PMX_AgregarOpenPO para agregar un Open PO
    /// </summary>
    public async Task<RegistrarPartidaResponse?> AgregarOpenPOAsync(AgregarOpenPORequest request)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"EXEC csp_PMX_AgregarOpenPO 
                @Referencia = @Referencia, 
                @po = @po, 
                @packing = @packing";
            command.CommandType = System.Data.CommandType.Text;

            var paramReferencia = command.CreateParameter();
            paramReferencia.ParameterName = "@Referencia";
            paramReferencia.Value = request.Referencia;
            command.Parameters.Add(paramReferencia);

            var paramPo = command.CreateParameter();
            paramPo.ParameterName = "@po";
            paramPo.Value = request.Po;
            command.Parameters.Add(paramPo);

            var paramPacking = command.CreateParameter();
            paramPacking.ParameterName = "@packing";
            paramPacking.Value = request.Packing;
            command.Parameters.Add(paramPacking);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new RegistrarPartidaResponse
                {
                    Estatus = reader["estatus"] != DBNull.Value && Convert.ToBoolean(reader["estatus"]),
                    Msg = reader["msg"]?.ToString() ?? string.Empty
                };
            }

            return null;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }
}