# Configuracion de base de datos SQL Server

PrevioMX API usa Entity Framework Core como acceso a SQL Server, pero la logica de negocio se ejecuta principalmente mediante stored procedures en `AuthDbContext`.

No hay carpeta de migraciones EF en el repositorio; no asumas que `dotnet ef database update` crea el esquema operativo. La base debe contener los stored procedures y columnas esperadas por `AuthDbContext`.

## Connection string

La API requiere `ConnectionStrings:DefaultConnection`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=servidor;Database=Aduasis;User Id=usuario;Password=***;TrustServerCertificate=True;Application Name=PrevioMX_API;"
  }
}
```

Parametros comunes:

- `Server`: host o instancia de SQL Server.
- `Database`: base de datos de negocio.
- `User Id` / `Password`: credenciales SQL.
- `Integrated Security=True`: alternativa para autenticacion Windows en ambientes compatibles.
- `TrustServerCertificate=True`: util en desarrollo con certificados no confiables; evitarlo en produccion si se puede validar el certificado.
- `Application Name=PrevioMX_API`: ayuda a identificar conexiones.

Para produccion, usa variables de entorno o un gestor de secretos:

```bash
ConnectionStrings__DefaultConnection="Server=prod;Database=Aduasis;User Id=app_user;Password=***;Encrypt=True;TrustServerCertificate=False;Application Name=PrevioMX_API;"
```

## Permisos requeridos

El usuario de base de datos necesita:

- `EXECUTE` sobre los stored procedures listados en `STORED_PROCEDURES.md`.
- Permisos de lectura/escritura que esos stored procedures requieran internamente.
- Permiso de conexion a la base indicada por `DefaultConnection`.

Evita usar `sa` en produccion; crea un usuario de aplicacion con permisos minimos.

## Stored procedures requeridos

Los principales grupos son:

- Autenticacion: `CSP_PMX_Login`.
- Catalogos: `CSP_PMX_Catalogos`, `csp_PMX_ProveedoresListarPaginado`.
- Dashboard y detalle: `CSP_PMX_ObtenerPendientes`, `CSP_PMX_DetalleEntrada`, `CSP_PMX_DetallePOs`.
- Captura: `csp_PMX_RegistrarPartida`, `csp_PMX_ActualizarPartida`, `csp_PMX_EliminarPartida`, `csp_PMX_AgregarOpenPO`.
- Validaciones: `CSP_PMX_ValidarClasificacion`, `CSP_PMX_ValidarCierrePrevio`, `CSP_PMX_ValidarCuarentenas`, `SP_FEA_ValidarTokenTeamleader_Result`, `csp_PMX_ValidaMarca`, `csp_PMX_ValidaModelo`.
- Reapertura: `csp_PMX_ExistePrevioCerrado`, `csp_PMX_GetProveedorPrevio`, `sp_previo_TL`, `csp_PMX_ReabrirPrevio`.

Consulta `STORED_PROCEDURES.md` para parametros y columnas esperadas.

## Verificacion rapida

1. Ejecuta la API con perfil HTTPS:

   ```bash
   dotnet run --project PrevioMX_Api/PrevioMX_Api.csproj --launch-profile https
   ```

2. Haz login:

   ```bash
   curl -X POST "https://localhost:5001/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d '{"usuario":"USUARIO.MTY","password":"password"}'
   ```

3. Con el token, prueba un endpoint que ejecute SP de negocio:

   ```bash
   TOKEN="eyJ..."

   curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
     -H "Authorization: Bearer $TOKEN"
   ```

Si login funciona pero pendientes falla, la conexion existe pero puede faltar permiso o contrato de columnas en los SP de visualizacion.

## Diagnostico de errores frecuentes

### `Connection string 'DefaultConnection' no encontrada`

`Program.cs` detiene el arranque si no existe `ConnectionStrings:DefaultConnection`. Revisa `appsettings.json`, `appsettings.Development.json` o variables de entorno.

### `Login failed for user`

- Usuario o password SQL incorrectos.
- El login SQL no tiene acceso a la base.
- La cadena esta apuntando a otro servidor/base.

### `Cannot open database`

- La base no existe.
- El usuario no esta mapeado a la base.
- La base esta offline o inaccesible desde el host de la API.

### Error de columna inexistente en un reader

El stored procedure devolvio un resultset distinto al esperado por `AuthDbContext`. Compara los nombres de columnas con `STORED_PROCEDURES.md` y el metodo C# correspondiente.

### Timeout o error de red

- Verifica conectividad al servidor SQL.
- Revisa firewall/puerto 1433 o puerto configurado.
- Confirma que el servidor SQL permita conexiones remotas.

## Seguridad operativa

- No commitees contrasenas reales.
- Usa usuarios de aplicacion con permisos minimos.
- Usa `Encrypt=True` y certificados validos en conexiones remotas cuando sea posible.
- Rota `JwtSettings:SecretKey` y credenciales SQL con proceso controlado; al rotar `SecretKey`, todos los JWT existentes dejan de ser validos.
- Revisa logs de autenticacion, pero evita imprimir tokens completos o secretos.
