# Configuracion de base de datos SQL Server

PrevioMX usa Entity Framework Core como capa de acceso, pero la logica de datos
del dominio se ejecuta mediante stored procedures en SQL Server. No hay
migraciones EF versionadas para crear el esquema de negocio.

## Cadena de conexion

`Program.cs` requiere `ConnectionStrings:DefaultConnection`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=<servidor>;Database=Aduasis;User Id=<usuario>;Password=<password>;TrustServerCertificate=True;Application Name=PrevioMX_API;"
  }
}
```

Recomendaciones:

- No commitear credenciales reales.
- Usar variables de entorno o configuracion del host en ambientes compartidos.
- Preferir usuarios con permisos minimos: `EXECUTE` sobre los stored procedures
  requeridos y lectura/escritura solo donde aplique.
- Para conexiones remotas productivas, evaluar `Encrypt=True` y certificados
  validos en lugar de depender de `TrustServerCertificate=True`.

Variable de entorno equivalente:

```bash
ConnectionStrings__DefaultConnection="Server=<servidor>;Database=Aduasis;User Id=<usuario>;Password=<password>;TrustServerCertificate=True;Application Name=PrevioMX_API;"
```

## Modelo de acceso

`AuthDbContext` registra un `DbSet<User>` minimo para compatibilidad de EF, pero
los flujos activos no dependen de migraciones ni de una tabla `Users` creada por
este repositorio. Los metodos del contexto ejecutan procedures como:

- `CSP_PMX_Login`
- `CSP_PMX_ObtenerPendientes`
- `CSP_PMX_DetalleEntrada`
- `csp_PMX_RegistrarPartida`
- `csp_PMX_ActualizarPartida`
- `csp_PMX_EliminarPartida`
- `CSP_PMX_ValidarCierrePrevio`
- `SP_FEA_ValidarTokenTeamleader_Result`

El inventario completo esta en
[STORED_PROCEDURES.md](STORED_PROCEDURES.md).

## Verificacion local

1. Configurar `ConnectionStrings:DefaultConnection`.
2. Ejecutar la API:

   ```bash
   dotnet run
   ```

3. Abrir Swagger (`https://localhost:5001/swagger` en el perfil local comun).
4. Ejecutar `POST /api/Auth/login` con un usuario valido.
5. Con el JWT, probar un endpoint que toque BD, por ejemplo
   `GET /api/Visualization/pendientes/{equipo}`.

Si login funciona pero otro endpoint falla, revisar especificamente el stored
procedure y columnas de salida de ese flujo.

## Troubleshooting

| Sintoma | Causa probable | Accion |
| --- | --- | --- |
| `Connection string 'DefaultConnection' no encontrada` | Falta la seccion de configuracion. | Definir `ConnectionStrings:DefaultConnection`. |
| `Login failed for user` | Credenciales SQL incorrectas o usuario sin permiso. | Verificar usuario/password y permisos en SQL Server. |
| `Cannot open database` | Base inexistente o sin permiso. | Confirmar nombre de base y acceso del usuario. |
| Error de red o instancia | Servidor/puerto no accesible. | Revisar host, puerto 1433, firewall y VPN/red. |
| Columna no encontrada en reader | El procedure cambio su result set. | Alinear columnas con el DTO leido en `AuthDbContext`. |
| `No se obtuvo respuesta del procedimiento` | Procedure no devolvio filas para una operacion esperada. | Revisar parametros enviados y reglas internas del procedure. |

## Al cambiar contratos de BD

1. Actualizar o validar el stored procedure en SQL Server.
2. Ajustar parametros y mapeo en `AuthDbContext`.
3. Actualizar DTOs y servicios de API.
4. Revisar `PrevioMX_Web/src/services/previo.service.js` si cambia el contrato
   HTTP.
5. Actualizar [STORED_PROCEDURES.md](STORED_PROCEDURES.md) y
   [USO_ENDPOINTS.md](USO_ENDPOINTS.md).
