# Autenticación JWT en PrevioMX API

La API usa JWT Bearer para proteger los controladores de negocio. La configuración está en `Program.cs` y `JwtSettings` de `appsettings.json`.

## Configuración requerida

```json
{
  "JwtSettings": {
    "SecretKey": "clave-secreta-de-al-menos-32-caracteres",
    "Issuer": "PrevioMX_API",
    "Audience": "PrevioMX_Web",
    "ExpirationMinutes": 1440,
    "RefreshTokenExpirationDays": 7
  }
}
```

Reglas verificadas en `Program.cs`:

- `ValidateIssuer = true`
- `ValidateAudience = true`
- `ValidateLifetime = true`
- `ValidateIssuerSigningKey = true`
- `ClockSkew = TimeSpan.Zero`

En produccion, configura `SecretKey` y connection strings mediante variables de entorno o un gestor de secretos.

## Endpoints de autenticación

### POST `/api/Auth/login`

Endpoint operativo. Valida credenciales con `CSP_PMX_Login` y genera JWT.

Request:

```json
{
  "usuario": "USUARIO.MTY",
  "password": "password"
}
```

Respuesta:

```json
{
  "token": "eyJ...",
  "refreshToken": "token_de_refresh",
  "user": {
    "idUsuario": "YRO",
    "usuario": "usuario.mty",
    "correoElectronico": "usuario@grupoei.com.mx",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "lider.mty"
  }
}
```

Error de credenciales:

```json
{
  "message": "Credenciales inválidas"
}
```

### POST `/api/Auth/register`

La ruta existe, pero `AuthService.RegisterAsync` aún no implementa registro. Actualmente retorna `null`, por lo que el controller responde `409 Conflict`.

### POST `/api/Auth/refresh`

La ruta existe, pero `AuthService.RefreshTokenAsync` aún no implementa renovación. Actualmente retorna `null`, por lo que el controller responde `401 Unauthorized`.

## Uso del token

Header requerido:

```http
Authorization: Bearer {token}
```

Ejemplo:

```bash
TOKEN="eyJ..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

El `refreshToken` no se envía en `Authorization`. En `appsettings.json`, `ExpirationMinutes` es `1440` (24 h). Si la clave falta, `JwtService` usa fallback `"60"`. `RefreshTokenExpirationDays` está en configuración pero el código actual no lo consume (refresh no está implementado).

## Claims emitidos

`JwtService` genera claims a partir de `LoginResultDto`:

| Claim | Origen | Uso |
| --- | --- | --- |
| `ClaimTypes.NameIdentifier` | `IdUsuario` | Cierre de previo (`@ID_USUARIO`) |
| `ClaimTypes.Email` | `CorreoElectronico` | Identidad del usuario |
| `ClaimTypes.Name` | `Usuario` | Nombre corto de usuario |
| `Equipo` | `Equipo` | Contexto del dashboard |
| `GrupoId` | `GrupoId` | Contexto de permisos/grupo |
| `Lider` | `Lider` | Contexto de liderazgo |
| `jti` | GUID generado | Identificador único del token |

`iss`, `aud` y `exp` deben coincidir con la configuración de JWT.

## Integración con Swagger

1. Ejecuta `POST /api/Auth/login`.
2. Copia solo `token`.
3. En **Authorize**, escribe:

   ```text
   Bearer eyJ...
   ```

4. Prueba un endpoint protegido real, por ejemplo `GET /api/Visualization/pendientes/MANCHESTER`.

Ver también `SWAGGER_AUTENTICACION.md`.

## Integración frontend

`PrevioMX_Web/src/services/auth.service.js`:

- Llama `POST /api/Auth/login`.
- Guarda `token` y `user` en `localStorage`.

`PrevioMX_Web/src/services/api.service.js`:

- Agrega el header `Authorization`.
- Decodifica `exp` del JWT antes de cada request.
- Si el token expira, limpia `token`, `user` y `captureData`, y redirige al login.
- Excluye `/api/Protected/valida-token-teamleader` de la redirección automática para que la UI pueda mostrar el error.

## Proteger endpoints

Controladores de negocio usan `[Authorize]`, por ejemplo:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VisualizationController : ControllerBase
{
}
```

`AuthController` usa `[AllowAnonymous]` para permitir login sin JWT.

## Troubleshooting

### 401: se requiere autenticación

- Falta `Authorization`.
- El header no tiene el formato `Bearer {token}`.
- El token está expirado o truncado.

### 401: firma inválida

- La `SecretKey` usada para emitir el token no coincide con la API que lo valida.
- El token fue copiado con comillas, espacios o contenido JSON adicional.

### Token expirado

`ClockSkew` es cero, por lo que la expiración es estricta. Como refresh no está operativo, vuelve a hacer login.

### Cierre de previo devuelve Unauthorized

`VisualizationController.GetValidarCierrePrevio` requiere `ClaimTypes.NameIdentifier`. Verifica que el token venga de `POST /api/Auth/login` y contenga `idUsuario`.
