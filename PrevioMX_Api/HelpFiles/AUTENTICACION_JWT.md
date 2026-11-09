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

`AuthService` genera JWT + refresh aleatorio (64 bytes Base64). El refresh **no se guarda** en BD. `auth.service.login` tampoco lo escribe en `localStorage`: solo `token` y `user`.

La UI activa es `LoginView.jsx`: campo `type="text"` (“Usuario / Correo”, `name="email"` interno). El valor se envía como `usuario`. `LoginForm.jsx` (`type="email"`) no se usa; no bloquearía usuarios tipo `YROSALES.MTY`.

`LoginRequest` no tiene `[Required]`. Usuario o password vacíos igual llegan a `CSP_PMX_Login` (401 si no hay fila). `LoginView` no manda ese caso: si falta un campo, corta con “Por favor ingresa correo y contraseña” y no llama a la API.

`auth.service.js` relanza `error.response?.data` (el objeto `{ message }`, sin `status`). `LoginView` compara `err.status === 401`, así que no entra al texto fijo “Credenciales incorrectas”. Muestra `err.message`, que en un 401 del API es `Credenciales inválidas`.

Ese 401 **también** entra al interceptor de respuesta (la única excepción es `valida-token-teamleader`). `redirectToLogin()` borra `token`, `user` y `captureData`. La navegación dura solo corre si `window.location.pathname` **no** es `import.meta.env.BASE_URL` (`/PrevioMX/`, con barra final). En el login con esa ruta el mensaje se queda. En `/PrevioMX` (sin barra) el `href` recarga y el texto se pierde. Un password mal después de un JWT vencido al arrancar borra el `captureData` que `authService.logout()` había dejado.

### Claims (`JwtService.GenerateToken`)

| Claim | Origen |
|---|---|
| `ClaimTypes.NameIdentifier` | `IdUsuario` — lo usa `validar-cierre-previo` |
| `ClaimTypes.Email` | `CorreoElectronico` |
| `ClaimTypes.Name` | `Usuario` |
| `Equipo` | `Equipo` — va en el JWT. El dashboard no lo lee: usa `localStorage.user.equipo` |
| `GrupoId` | `GrupoId` |
| `Lider` | `Lider` — va en el JWT y en `user.lider`; la UI no lo lee. El token de Team Leader es otro endpoint |
| `jti` | GUID |

Algoritmo: HS256. `ClockSkew = TimeSpan.Zero` (sin gracia de 5 minutos).

`Program.cs` registra tres eventos JWT. `OnMessageReceived` loguea solo los primeros 50 caracteres del header `Authorization` y añade `...`. `OnAuthenticationFailed` y `OnChallenge` loguean el header **completo** (incluye el JWT). No pegar esas líneas en tickets.

## Rutas no implementadas

| Ruta | Resultado real |
|---|---|
| `POST /api/Auth/register` | Siempre 409 (el servicio retorna `null`) |
| `POST /api/Auth/refresh` con `refreshToken` no vacío | 401 (servicio no implementado) |
| `POST /api/Auth/refresh` sin token o body vacío | **400**, no 401 |

`GetPrincipalFromExpiredToken` existe en `JwtService` pero nadie lo llama. `RegisterUserAsync` / `UpdateRefreshTokenAsync` / `GetUserByRefreshTokenAsync` / `EmailExistsAsync` están en `AuthDbContext` y **no** se usan desde `AuthService`.

`authService.refreshToken()` (web) POST-ea `/api/Auth/refresh` **sin** `{ refreshToken }`.

## Frontend

- Token y `user` en `localStorage`. `isAuthenticated` es `!!user`, no “hay token”. Un JWT huérfano sin objeto `user` no abre las rutas.
- `JSON.parse` de `localStorage.user` en `AuthProvider` no tiene `try`. Un valor corrupto tumba el arranque antes del dashboard.
- Axios agrega `Authorization: Bearer {token}` si el cliente no considera el JWT vencido. Si lo considera vencido, el interceptor de **request** llama `redirectToLogin()` (borra `token`, `user` y `captureData`) y rechaza con `Error('Token expirado')` **sin** llamar a la API. Eso incluye el `POST /api/Auth/login`: `auth.service` relanza el string `'Token expirado'` y `LoginView` no lee `.message` de un string, así que el primer submit muestra “Ocurrió un error al iniciar sesión”. El storage ya quedó limpio; el segundo submit sí sale. El logout de arranque (`authService.logout`) no borra `captureData`.
- El decode está duplicado en `api.service.js` y `AuthProvider.jsx`: `JSON.parse(atob(token.split('.')[1]))`. No pasa el payload de base64url a base64. `atob` lanza `Invalid character` si el segmento trae `-` o `_`. El `catch` devuelve “expirado”. Un JWT de 24 h que el servidor aceptaría puede botar la sesión al recargar o en el primer Axios, según los bytes del payload (claims largos de `ClaimTypes.*`, GUIDs, `jti`). No depende de `ClockSkew`.
- Si el payload parsea y no trae `exp`, `Date.now() >= NaN` es false: el cliente lo envía. El servidor, con `ValidateLifetime`, lo rechaza.
- `authService.isAuthenticated()` devuelve `!!getToken()` y **nadie lo llama**. El guard (`AppRoutes.jsx`) usa `!!user`.
- Todo request Axios manda el header `ngrok-skip-browser-warning: true`. No cambia la auth.
- `VITE_DEV_MODE=true` pone un usuario mock `{ id, email, name }` en React **sin** token y **sin** persistir `localStorage.user`. El dashboard igual llama `getPendientes(localStorage.user.equipo || '')`.
- Cierre de sesión: ver tabla en el [README raíz](../../README.md#sesión-y-localstorage).
- 401/403 Axios (excepto `valida-token-teamleader`) limpian `token`/`user`/`captureData`. El `window.location` a `BASE_URL` (`/PrevioMX/`) solo corre si el `pathname` actual es otro. El 401 de login entra en este camino.
- Timeout/red (`ECONNABORTED`, `ERR_NETWORK`) también limpian sesión si no hay token o ya venció.

## CORS

Orígenes permitidos: `http://localhost:5173`, `http://localhost:3000`, `http://localhost:5000`. `AllowCredentials`. Un front desplegado contra API local será bloqueado por el navegador.

## Troubleshooting

| Síntoma | Causa habitual |
|---|---|
| 401 “token ha expirado” | `exp` vencido en el servidor; no hay refresh real; `ClockSkew = 0` |
| Vuelve al login con un JWT que jwt.io aún muestra vigente | `atob` del payload base64url (`-` o `_`) y el `catch` lo trata como vencido. No es el `exp` de 1440 min |
| El primer login dice “Ocurrió un error al iniciar sesión” y el segundo entra | Había un token que el cliente considera vencido; el POST no salió. El interceptor ya limpió el storage |
| Un login fallido se llevó `captureData` | El 401 de credenciales también llama `redirectToLogin`. El logout de arranque no borra ese dato; este 401 sí |
| 401 firma inválida | `SecretKey` distinta a la del login |
| 401 “Se requiere autenticación” | Header ausente o no es `Bearer {token}` |
| Login 401 | `CSP_PMX_Login` sin fila |
| Swagger 404 | No está `Development` (`UseSwagger` solo en ese ambiente) |
| Redirect inesperado a login | 401/403 Axios (no el fetch de PDF.js) o timeout con JWT vencido |
| El log trae el JWT completo | `OnAuthenticationFailed` / `OnChallenge` escriben el header entero; `OnMessageReceived` recorta a 50 caracteres |
