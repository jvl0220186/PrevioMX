# Configuración de base de datos

## Intento

La API no modela un esquema propio. `AuthDbContext` (EF Core + SQL Server) ejecuta stored procedures de la base **Aduasis** y mapea result sets a DTOs.

No hay migraciones EF. No crear una tabla `Users` ni SPs `sp_GetUserByEmail` / `sp_RegisterUser` para este producto: el login real es `CSP_PMX_Login`.

## Cadena de conexión

Clave: `ConnectionStrings:DefaultConnection`.

Si falta, `Program.cs` lanza `InvalidOperationException`.

Formato (valores de ejemplo, **no** copiar passwords del `appsettings` del repo):

```
Server=<host>;Database=Aduasis;User Id=<usuario>;Password=<secreto>;TrustServerCertificate=True;Application Name=PrevioMX_API;
```

Ambiente:

- `appsettings.json` — embebido (`EmbeddedResource` + `CopyToOutputDirectory=Always`). Un cambio local no sustituye el embebido si el output ya tiene una copia vieja: limpiar `bin/` o sobrescribir el archivo de salida.
- `appsettings.Development.json` — puede sobreescribir la cadena en Development.
- Producción: `ConnectionStrings__DefaultConnection`.

## Qué hace EF

- `DbSet<User>` existe solo para mapear leftovers de scaffold (`RegisterUserAsync`, `GetUserByRefreshTokenAsync`). **AuthService no los llama.**
- Pendientes, detalle, partidas, MMS, OpenPO y reapertura usan `SqlConnection` + `SqlDataReader` (columnas por nombre).
- Catálogos y login usan `Database.SqlQueryRaw<T>`.

Columnas de catálogo: SQL `c_value` / `c_text` → DTO `CValue` / `CText`.

Proveedores paginados: `csp_PMX_ProveedoresListarPaginado` también devuelve `TotalRows`. `CatalogoPagiandoRequest.PageNumber` default = **1**. El combo web empieza en página **0**. `CatalogosService` calcula `More = page < totalPages` (asume 1-based); con página 0 y una sola página, `More` queda `true`.

## Dependencias fuera del repo

`PrevioMX_Api.csproj` referencia:

- `..\..\..\DLL\onecore.security.encryptvr.dll`
- `..\..\..\Apostol\Dev\ApostolWeb\ApostolWeb\onecore.security.services.dll`

Sin esas DLLs el build falla. `AuthService` importa `onecore.security.services`; el decrypt de login está comentado.

## Verificación

```bash
cd PrevioMX_Api
dotnet run --launch-profile https
# POST /api/Auth/login con un usuario Aduasis válido
```

## Troubleshooting

| Error | Qué revisar |
|-------|-------------|
| `Connection string 'DefaultConnection' no encontrada` | `appsettings` / env; archivo embebido vs output |
| Login failed / network | Host, puerto 1433, firewall, credenciales |
| SP no existe | El usuario SQL debe poder `EXECUTE` los `CSP_PMX_*` listados en [STORED_PROCEDURES.md](STORED_PROCEDURES.md) |
| Columnas faltantes al leer | El reader usa nombres fijos (`id_entrada`, `is_spmms`, `ruta_documento`, …) |

## Seguridad

- No commitear passwords reales.
- No usar `sa` en producción.
- `TrustServerCertificate=True` es solo para desarrollo.
