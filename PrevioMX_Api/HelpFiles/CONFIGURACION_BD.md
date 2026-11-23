# Configuración de base de datos

## Intent

La API no modela el dominio con entidades EF. `AuthDbContext` abre SQL Server y ejecuta stored procedures (`SqlQueryRaw` / `SqlDataReader`).

## Cadena de conexión

Clave: `ConnectionStrings:DefaultConnection`.

`Program.cs` lanza si falta. El valor de desarrollo apunta a un SQL Server interno y la base `Aduasis`. **No documentar ni copiar la contraseña** del `appsettings.json`.

Forma (sin secretos):

```
Server=<host>;Database=Aduasis;User Id=<user>;Password=<secret>;TrustServerCertificate=True;Application Name=PrevioMX_API;
```

Override por ambiente: `ConnectionStrings__DefaultConnection`.

`appsettings.json` se quitó de `Content` y se marcó `EmbeddedResource` con `CopyToOutputDirectory=Always`. Esa marca copia el archivo al output; el host no lo lee desde el ensamblado. `Program.cs` no llama `GetManifestResourceStream`. `CreateBuilder` usa el JSON del content root y, en Development, el overlay `appsettings.Development.json` (también define `DefaultConnection`). `ConnectionStrings__DefaultConnection` pisa los dos archivos. Hay que volver a ejecutar o publicar para que el proceso vea el archivo nuevo: editar solo el binario embebido no alcanza.

No hay migraciones EF de negocio. No ejecutar `dotnet ef migrations add` para “crear Users”.

## Qué no hacer

- El `DbSet<User>` / tabla `Users` solo sirve a SPs de registro/refresh que **no** usa `AuthService`.
- El usuario SQL necesita `EXECUTE` sobre los SPs de [STORED_PROCEDURES.md](STORED_PROCEDURES.md).
- No commitear connection strings con password en documentación.

## Dependencias de build

`PrevioMX_Api.csproj` referencia DLLs **fuera del repo**:

- `onecore.security.encryptvr` → `..\..\..\DLL\onecore.security.encryptvr.dll`
- `onecore.security.services` → `..\..\..\Apostol\Dev\ApostolWeb\ApostolWeb\onecore.security.services.dll`

Sin esas rutas el `dotnet build` falla. `AuthService` importa `onecore.security.services` (el decrypt de token de login está comentado).

`CatalogosService.cs` importa `Azure` y `System.Drawing` y no los usa. El csproj no referencia esos paquetes. Si el compilador no resuelve el namespace, el error sale en ese archivo y no en la consulta de catálogos.

`.config/dotnet-tools.json` declara `dotnet-ef` 10.0.2. Los `PackageReference` de EF son 8.0.0. No hay carpeta `Migrations`: los SPs viven en SQL Server.

## Troubleshooting

| Error | Qué revisar |
|---|---|
| `Connection string 'DefaultConnection' no encontrada` | `appsettings` / variable de entorno |
| Login failed / network error | host, firewall, SQL escuchando, TrustServerCertificate |
| Fallo al mapear columnas | el SP cambió nombres. Los readers usan snake_case (`id_entrada`, `estatus`, …). `SqlQueryRaw` no: login busca `IdUsuario`, `Usuario`, `CorreoElectronico`, `Equipo`, `GrupoId`, `Lider` (sin `[Column]`); catálogos usan `[Column("c_value")]` y `[Column("c_text")]`; proveedores añade `TotalRows` |
| Login 500 en vez de 401 | `AuthController` no envuelve la excepción del materializer ni un `SqlParameter` cuyo valor es null |
| Build: metadata file not found | DLLs `onecore.security.*` ausentes |
| 500 en `/pendientes/{equipo}` | `ruta_documento` partido por `\|` sin trim. Un segmento con espacio al inicio, ruta relativa o sin esquema hace fallar `new Uri` y aborta todo el listado. El detalle está en [STORED_PROCEDURES.md](STORED_PROCEDURES.md) |
