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
    /// Ejecuta el stored procedure CSP_PMX_ObtenerPendientes para obtener pendientes
    /// </summary>
    public async Task<List<PendienteDto>> GetPendientesAsync()
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_ObtenerPendientes";
            command.CommandType = System.Data.CommandType.Text;

            using var reader = await command.ExecuteReaderAsync();
            var results = new List<PendienteDto>();

            while (await reader.ReadAsync())
            {
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
                    RutaDocumento = reader["ruta_documento"]?.ToString(),
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
                    Series = reader["series"] != DBNull.Value ? Convert.ToBoolean(reader["series"]) : null
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
    public async Task<ValidarCierrePrevioResponse?> GetValidarCierrePrevioAsync(string idEntrada, string idUsuario)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "EXEC CSP_PMX_ValidarCierrePrevio @ID_ENTRADA = @ID_ENTRADA, @ID_USUARIO = @ID_USUARIO";
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
}

