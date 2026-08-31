# Autenticación JWT

## Intento

Proteger catálogos, visualización y clasificación. El login delega credenciales a `CSP_PMX_Login`; la API solo firma el JWT.

## Configuración

`JwtSettings` en `appsettings.json` (el archivo es `EmbeddedResource`):

| Clave | Valor en repo | Uso real |
|-------|---------------|----------|
| `SecretKey` | requerida (lanza si falta) | Firma HS256 |
| `Issuer` | `PrevioMX_API` | Validado (`ValidateIssuer = true`) |
| `Audience` | `PrevioMX_Web` | Validado (`ValidateAudience = true`) |
| `ExpirationMinutes` | `1440` (24 h) | `JwtService` usa `60` solo si la clave falta |
| `RefreshTokenExpirationDays` | `7` | **No se lee** en ningún servicio |

`ClockSkew = TimeSpan.Zero` (`Program.cs`): no hay gracia después de `exp`.

En producción, mover `SecretKey` a variables de entorno (`JwtSettings__SecretKey`). No commitear claves reales.

## Endpoint operativo

### `POST /api/Auth/login` — `[AllowAnonymous]`

**Body:**

```json
{
  "usuario": "usuario.sucursal",
  "password": "********"
}
```

Campos: `LoginRequest.Usuario` y `LoginRequest.Password` (no `email`).

**200:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "<base64 64 bytes>",
  "user": {
    "idUsuario": "ABC",
    "usuario": "usuario.sucursal",
    "correoElectronico": "usuario@dominio",
    "equipo": "EQUIPO",
    "grupoId": "<guid>",
    "lider": "usuario.sucursal"
  }
}
```

`refreshToken` se genera en memoria (`JwtService.GenerateRefreshToken`) y **no se persiste**. No sirve para renovar sesión.

**401:** `{ "message": "Credenciales inválidas" }` si `CSP_PMX_Login` no devuelve fila.

## Rutas que existen pero no funcionan

| Ruta | Código | Resultado |
|------|--------|-----------|
| `POST /api/Auth/register` | `AuthService.RegisterAsync` → `null` | **409** `{ "message": "El email ya está registrado" }` (mensaje engañoso) |
| `POST /api/Auth/refresh` | `AuthService.RefreshTokenAsync` → `null` | **401** `{ "message": "Refresh token inválido o expirado" }` |

El frontend (`auth.service.js`) tiene helpers `register`/`refreshToken`; la UI de login solo llama `login`.

## Claims del JWT

| Claim | Origen (`LoginResultDto`) |
|-------|---------------------------|
| `ClaimTypes.NameIdentifier` | `IdUsuario` — lo usa `validar-cierre-previo` |
| `ClaimTypes.Email` | `CorreoElectronico` |
| `ClaimTypes.Name` | `Usuario` |
| `Equipo` | `Equipo` — el dashboard pide pendientes con este valor |
| `GrupoId` | `GrupoId` |
| `Lider` | `Lider` |
| `jti` | GUID nuevo por token |

## Proteger endpoints

Controladores de negocio llevan `[Authorize]` a nivel de clase:

- `VisualizationController`
- `CatalogosController`
- `ClasificacionController`
- `ProtectedController`
- `WeatherForecastController`

Header: `Authorization: Bearer {token}` (un espacio, sin comillas).

## Pipeline (`Program.cs`)

`UseCors` → `UseAuthentication` → `UseAuthorization` → `MapControllers`.

Errores JWT se serializan como JSON (`statusCode`, `message`, `error`). Token expirado vs firma inválida vs malformado tienen mensajes distintos.

## Frontend

- Token y `user` en `localStorage` (`auth.service.js`).
- Axios (`api.service.js`) adjunta Bearer y redirige al login en **401 y 403**, excepto `POST /api/Protected/valida-token-teamleader`.
- Un **403** de `pdf-proxy` (host no permitido) se trata como sesión expirada.
- `VITE_DEV_MODE=true` en `AuthProvider` inventa un usuario **sin JWT**. Las llamadas protegidas fallarán.

## Troubleshooting

| Síntoma | Causa verificada |
|---------|------------------|
| 401 al arrancar | Token vencido; `ClockSkew` es 0 |
| Firma inválida | `SecretKey` distinta a la usada al firmar |
| CORS en el browser | Origen no está en `AllowFrontend` (solo localhost 5173/3000/5000) |
| Register/refresh “fallan” | No implementados; no es un bug de red |
