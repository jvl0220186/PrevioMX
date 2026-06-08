# Autenticacion JWT en PrevioMX API

La API protege los endpoints de negocio con JWT Bearer. El unico flujo de
autenticacion implementado actualmente es login contra el stored procedure
`CSP_PMX_Login`; el token resultante se usa para consultar dashboard, captura,
catalogos, clasificacion y operaciones de previo.

## Configuracion

`Program.cs` lee la seccion `JwtSettings`:

```json
{
  "JwtSettings": {
    "SecretKey": "<clave-minimo-32-caracteres>",
    "Issuer": "PrevioMX_API",
    "Audience": "PrevioMX_Web",
    "ExpirationMinutes": 1440,
    "RefreshTokenExpirationDays": 7
  }
}
```

Notas operativas:

- `SecretKey` debe ser la misma al generar y validar tokens.
- En ambientes compartidos o produccion, no guardar secretos reales en el
  repositorio; usar variables de entorno, secret manager o configuracion del
  host.
- La validacion usa `ClockSkew = TimeSpan.Zero`, por lo que la expiracion se
  aplica sin margen adicional.
- CORS permite los origenes locales `http://localhost:5173`,
  `http://localhost:3000` y `http://localhost:5000`.

## Endpoints publicos

### POST `/api/Auth/login`

Body:

```json
{
  "usuario": "YROSALES.MTY",
  "password": "password"
}
```

Comportamiento:

1. `AuthService.LoginAsync` llama `AuthDbContext.LoginAsync`.
2. `AuthDbContext` ejecuta `CSP_PMX_Login @P_USUARIO, @P_PASSWORD`.
3. Si hay resultado, `JwtService.GenerateToken` emite el JWT.
4. La respuesta incluye `token`, `refreshToken` generado en memoria y datos de
   usuario.

Respuesta exitosa:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-refresh-token",
  "user": {
    "idUsuario": "123",
    "usuario": "YROSALES.MTY",
    "correoElectronico": "usuario@dominio.com",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "TEAMLEADER"
  }
}
```

`401 Unauthorized` indica que el procedure no devolvio usuario.

### POST `/api/Auth/register`

La ruta existe, pero no esta implementada en `AuthService.RegisterAsync`. El
servicio registra un warning y devuelve `null`, por lo que el controlador
responde conflicto.

### POST `/api/Auth/refresh`

La ruta existe, pero no esta implementada en `AuthService.RefreshTokenAsync`.
Aunque el login devuelve un `refreshToken`, la aplicacion actual no lo persiste
ni lo usa para renovar sesion.

## Claims del token

`JwtService` agrega estos claims desde `LoginResultDto`:

| Claim | Fuente | Uso conocido |
| --- | --- | --- |
| `ClaimTypes.NameIdentifier` | `IdUsuario` | `validar-cierre-previo` lo usa como `@ID_USUARIO`. |
| `ClaimTypes.Email` | `CorreoElectronico` | Diagnostico y endpoints protegidos de prueba. |
| `ClaimTypes.Name` | `Usuario` | Identidad legible del usuario. |
| `Equipo` | `Equipo` | El frontend consulta pendientes por equipo del usuario. |
| `GrupoId` | `GrupoId` | Disponible para reglas de autorizacion futuras. |
| `Lider` | `Lider` | Disponible para flujos de aprobacion. |
| `jti` | GUID generado | Identificador unico del token. |

## Uso en peticiones protegidas

```http
Authorization: Bearer <token>
```

Ejemplo:

```bash
API=https://localhost:5001

TOKEN=$(curl -s "$API/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usuario":"YROSALES.MTY","password":"password"}' \
  | jq -r '.token')

curl "$API/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

En el frontend, `api.service.js`:

- Lee `token` desde `localStorage`.
- Decodifica `exp` para redirigir al login si ya expiro.
- Adjunta `Authorization: Bearer <token>` a cada request.
- Limpia `token`, `user` y `captureData` ante 401/403, excepto para
  `/api/Protected/valida-token-teamleader`, donde el 401 puede ser una
  aprobacion rechazada y no una sesion invalida.

## Swagger

1. Ejecutar la API en ambiente de desarrollo.
2. Abrir `https://localhost:5001/swagger`.
3. Probar `POST /api/Auth/login`.
4. Copiar `token`.
5. Usar **Authorize** con `Bearer <token>`.
6. Ejecutar endpoints protegidos.

## Troubleshooting

| Sintoma | Causa probable | Accion |
| --- | --- | --- |
| `JWT SecretKey no configurada` | Falta `JwtSettings:SecretKey`. | Configurar la clave en `appsettings`, variable de entorno o host. |
| `401` con token faltante | No se envio header `Authorization`. | Usar `Authorization: Bearer <token>`. |
| `401` por firma invalida | `SecretKey` distinta entre emision y validacion. | Revisar configuracion efectiva del ambiente. |
| `401` por expiracion | `exp` del JWT ya paso. | Hacer login nuevamente; refresh no esta implementado. |
| `401` en Team Leader | Token de aprobacion incorrecto. | Revisar token capturado; no necesariamente invalida la sesion principal. |
| `validar-cierre-previo` devuelve 401 | El JWT no trae `NameIdentifier`. | Revisar salida de `CSP_PMX_Login` y `JwtService.GenerateToken`. |
