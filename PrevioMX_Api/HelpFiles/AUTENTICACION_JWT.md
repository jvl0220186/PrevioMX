# Autenticación JWT

## Intent

Proteger catálogos, visualización, clasificación y `Protected` con Bearer JWT. El login de negocio es `CSP_PMX_Login`, no una tabla `Users` de plantilla.

## Configuración (`JwtSettings`)

| Clave | Código | `appsettings.json` |
|---|---|---|
| `SecretKey` | Obligatoria (lanza si falta) | Valor de desarrollo embebido |
| `Issuer` | Fallback `PrevioMX_API` | `PrevioMX_API` |
| `Audience` | Fallback `PrevioMX_Web` | `PrevioMX_Web` |
| `ExpirationMinutes` | Fallback **60** si falta | **1440** (24 h) |
| `RefreshTokenExpirationDays` | **No se lee** | `7` |

En producción, no commitear `SecretKey`. Variable: `JwtSettings__SecretKey`.

`appsettings.json` es `EmbeddedResource` + `CopyToOutputDirectory=Always`. Un `appsettings` suelto en el output puede no ser el que gana si el embebido se carga después.

## Login

```http
POST /api/Auth/login
Content-Type: application/json

{ "usuario": "usuario.oficina", "password": "..." }
```

`AuthService` genera JWT + refresh aleatorio (64 bytes Base64). El refresh **no se guarda** en BD.

La UI activa es `LoginView.jsx`: campo `type="text"` (“Usuario / Correo”). El valor se envía como `usuario`. `LoginForm.jsx` (`type="email"`) no se usa; no bloquearía usuarios tipo `YROSALES.MTY`.

### Claims (`JwtService.GenerateToken`)

| Claim | Origen |
|---|---|
| `ClaimTypes.NameIdentifier` | `IdUsuario` — lo usa `validar-cierre-previo` |
| `ClaimTypes.Email` | `CorreoElectronico` |
| `ClaimTypes.Name` | `Usuario` |
| `Equipo` | `Equipo` — dashboard de pendientes |
| `GrupoId` | `GrupoId` |
| `Lider` | `Lider` |
| `jti` | GUID |

Algoritmo: HS256. `ClockSkew = TimeSpan.Zero` (sin gracia de 5 minutos).

`Program.cs` registra `OnMessageReceived`: loguea los primeros 50 caracteres del header `Authorization`. No pegar tokens reales en tickets.

## Rutas no implementadas

| Ruta | Resultado real |
|---|---|
| `POST /api/Auth/register` | Siempre 409 |
| `POST /api/Auth/refresh` | Siempre 401 |

`GetPrincipalFromExpiredToken` existe en `JwtService` pero nadie lo llama. `RegisterUserAsync` / `UpdateRefreshTokenAsync` / `GetUserByRefreshTokenAsync` / `EmailExistsAsync` están en `AuthDbContext` y **no** se usan desde `AuthService`.

## Frontend

- Token y `user` en `localStorage`.
- Axios agrega `Authorization: Bearer {token}` si el JWT no está expirado (decode de `exp` en el cliente).
- `VITE_DEV_MODE=true` pone un usuario mock **sin** token: las rutas `[Authorize]` fallan.
- 401/403 (excepto `valida-token-teamleader`) limpian sesión y redirigen a `basename` (`/PrevioMX/`).
- Timeout/red (`ECONNABORTED`, `ERR_NETWORK`) también limpian sesión si no hay token o ya venció.

## CORS

Orígenes permitidos: `http://localhost:5173`, `http://localhost:3000`, `http://localhost:5000`. `AllowCredentials`. Un front desplegado contra API local será bloqueado por el navegador.

## Troubleshooting

| Síntoma | Causa habitual |
|---|---|
| 401 “token ha expirado” | `exp` vencido; no hay refresh real; `ClockSkew = 0` |
| 401 firma inválida | `SecretKey` distinta a la del login |
| 401 “Se requiere autenticación” | Header ausente o no es `Bearer {token}` |
| Login 401 | `CSP_PMX_Login` sin fila |
| Swagger 404 | No está `Development` (`UseSwagger` solo en ese ambiente) |
| Redirect inesperado a login | 403 de `pdf-proxy` o timeout con JWT vencido |
