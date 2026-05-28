# Configuracion de base de datos SQL Server

La API usa Entity Framework Core como puerta de acceso a SQL Server, pero el dominio de
PrevioMX se ejecuta mediante stored procedures desde `Business/AuthDbContext.cs`. No hay
migraciones de EF Core para crear el esquema de captura, catalogos o previos.

## Connection string

`Program.cs` lee `ConnectionStrings:DefaultConnection`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=servidor;Database=Aduasis;User Id=usuario;Password=***;TrustServerCertificate=True;Application Name=PrevioMX_API;"
  }
}
```

Recomendaciones:

- No commitear credenciales reales en archivos de ambiente.
- En produccion, preferir variables de entorno, secretos del host o un gestor de secretos.
- Usar un usuario SQL con permisos minimos sobre los stored procedures requeridos.
- Mantener `TrustServerCertificate=False` cuando exista certificado valido.

Variable de entorno equivalente:

```bash
ConnectionStrings__DefaultConnection="Server=servidor;Database=Aduasis;User Id=usuario;Password=***;TrustServerCertificate=False;"
```

## Modelo EF actual

`AuthDbContext` declara:

```csharp
public DbSet<User> Users { get; set; }
```

Ese `DbSet` existe para mapear algunos resultados heredados de autenticacion. Los flujos
principales no dependen de migraciones EF:

- Login: `CSP_PMX_Login`
- Catalogos: `CSP_PMX_Catalogos`, `csp_PMX_ProveedoresListarPaginado`
- Captura/visualizacion: procedures `CSP_PMX_*` y `csp_PMX_*`
- Token Team Leader: `SP_FEA_ValidarTokenTeamleader_Result`

Consulta `STORED_PROCEDURES.md` para la lista verificada.

## Verificacion local

1. Configura `ConnectionStrings:DefaultConnection`.
2. Ejecuta la API:

   ```bash
   dotnet run --project PrevioMX_Api
   ```

3. Verifica login con `POST /api/Auth/login`.
4. Con el JWT, prueba un endpoint protegido, por ejemplo:

   ```bash
   curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
     -H "Authorization: Bearer $TOKEN"
   ```

No uses `/api/Auth/register` como prueba de base de datos: el endpoint existe, pero el
servicio actual no implementa registro.

## Troubleshooting

### Login devuelve 401

- `CSP_PMX_Login` no devolvio usuario.
- Las credenciales no corresponden al ambiente configurado.
- La API esta conectando a otra base de datos.

### Error de conexion SQL

- Verifica servidor, puerto, base de datos y credenciales.
- Confirma que el firewall permita la conexion.
- Revisa si el certificado exige `Encrypt=True` o permite `TrustServerCertificate=True`
  solo para desarrollo.

### Endpoints de captura devuelven 500

- Confirma que el usuario SQL tenga permisos de ejecucion sobre los stored procedures.
- Revisa parametros esperados por el procedure contra el request recibido.
- Revisa logs de API; `VisualizationController` registra el endpoint y claves como
  `idEntrada`, `referencia`, `idBulto` o `idProducto`.

### Standard Pack u OpenPO sin datos

- Verifica `CSP_PMX_ValidarClasificacion` para `validar-post`.
- Verifica `CSP_PMX_DetallePOs` cuando `esOpenPO` esta activo.

## Cuando cambiar esta guia

Actualiza este archivo si:

- Cambia la forma de configurar `DefaultConnection`.
- Se agregan migraciones EF reales para el dominio.
- Se cambia `AuthDbContext` para usar tablas directamente en lugar de stored procedures.
- Se implementa registro o refresh token con persistencia real.
