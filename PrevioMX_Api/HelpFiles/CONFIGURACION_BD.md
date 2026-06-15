# Configuracion de base de datos SQL Server

PrevioMX API se conecta a SQL Server con Entity Framework Core, pero no usa un
modelo relacional administrado por migraciones para el flujo principal. La
mayoria de operaciones llaman stored procedures desde `Business/AuthDbContext.cs`.

## Configuracion

La cadena se lee desde `ConnectionStrings:DefaultConnection`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=servidor-sql;Database=Aduasis;User Id=usuario;Password=***;TrustServerCertificate=True;Application Name=PrevioMX_API;"
  }
}
```

Parametros comunes:

| Parametro | Descripcion |
| --- | --- |
| `Server` | Host o instancia de SQL Server. |
| `Database` | Base con los stored procedures de PrevioMX; en el archivo versionado apunta a `Aduasis`. |
| `User Id` / `Password` | Credenciales de SQL Server. |
| `TrustServerCertificate` | Puede ser util en desarrollo; en produccion preferir certificados validos. |
| `Application Name` | Identifica conexiones de la API en SQL Server. |

En ambientes compartidos o productivos, configura la cadena por variables de
entorno:

```bash
ConnectionStrings__DefaultConnection="Server=servidor-sql;Database=Aduasis;User Id=previo_api;Password=***;TrustServerCertificate=False;Application Name=PrevioMX_API;"
```

## Registro en la API

`Program.cs` registra:

```csharp
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(connectionString));
```

Los servicios de dominio (`AuthService`, `CatalogosService`,
`VisualizationService`, `ClasificacionService`) reciben `AuthDbContext` y llaman
metodos que ejecutan stored procedures.

## Migraciones

No hay migraciones EF Core versionadas para crear la base de datos de negocio.
No ejecutes `dotnet ef database update` esperando crear el esquema productivo de
PrevioMX. Si se agregan tablas o SPs, coordina los scripts SQL con el equipo DBA
y actualiza `STORED_PROCEDURES.md` con las firmas usadas por la API.

`AuthDbContext` declara `DbSet<User>` y mapea `Users` para compatibilidad con
metodos heredados de registro/refresh, pero esos flujos no estan implementados
actualmente en `AuthService`.

## Verificacion de conectividad

1. Configura `ConnectionStrings:DefaultConnection`.
2. Ejecuta la API:

   ```bash
   dotnet run --project PrevioMX_Api
   ```

3. Prueba login con un usuario valido:

   ```bash
   curl -X POST "https://localhost:5001/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d '{"usuario":"YROSALES.MTY","password":"123"}'
   ```

4. Con el token, prueba un endpoint de negocio:

   ```bash
   curl "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
     -H "Authorization: Bearer $TOKEN"
   ```

Si login falla por credenciales, la conexion puede estar bien pero
`CSP_PMX_Login` no devolvio usuario. Si falla con excepcion SQL, revisar cadena,
red, permisos y disponibilidad del SP.

## Permisos requeridos

El usuario de base de datos debe poder ejecutar los stored procedures listados
en `STORED_PROCEDURES.md`. Como minimo para el flujo principal:

- `CSP_PMX_Login`
- `CSP_PMX_ObtenerPendientes`
- `CSP_PMX_DetalleEntrada`
- `CSP_PMX_Catalogos`
- `CSP_PMX_ValidarClasificacion`
- `csp_PMX_RegistrarPartida`
- `csp_PMX_ActualizarPartida`
- `csp_PMX_EliminarPartida`
- `CSP_PMX_ValidarCierrePrevio`

## Troubleshooting

### `Cannot open database`

- Verifica nombre de base de datos.
- Confirma permisos del usuario.
- Revisa si el ambiente espera otra cadena efectiva por variables de entorno.

### `Login failed for user`

- Verifica usuario/password de SQL Server.
- Revisa bloqueo o expiracion de la cuenta.
- Evita usar `sa` en produccion; usa un usuario con permisos minimos.

### Error de red o instancia inaccesible

- Confirma host, puerto e instancia.
- Verifica firewall y conectividad desde el servidor de API.
- Para instancias nombradas, usa el formato correcto del proveedor SQL Server.

### Error por columna inexistente

El API lee columnas por nombre en `AuthDbContext`. Compara el resultset del SP
con `STORED_PROCEDURES.md` y con el metodo C# correspondiente.

## Seguridad

- No publiques secretos en commits; usa variables de entorno o un gestor de
  secretos.
- Usa usuarios SQL con permisos minimos de `EXECUTE`.
- Prefiere `Encrypt=True` y certificados validos para conexiones remotas.
- Rota credenciales si una cadena queda expuesta.

