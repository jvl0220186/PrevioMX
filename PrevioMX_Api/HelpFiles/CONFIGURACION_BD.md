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

`appsettings.json` está como `EmbeddedResource` y se copia al output. Tras cambiar la cadena, reconstruir.

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

## Troubleshooting

| Error | Qué revisar |
|---|---|
| `Connection string 'DefaultConnection' no encontrada` | `appsettings` / variable de entorno |
| Login failed / network error | host, firewall, SQL escuchando, TrustServerCertificate |
| Fallo al mapear columnas | el SP cambió nombres (`id_entrada`, `c_value`, `estatus`, …) |
| Build: metadata file not found | DLLs `onecore.security.*` ausentes |
