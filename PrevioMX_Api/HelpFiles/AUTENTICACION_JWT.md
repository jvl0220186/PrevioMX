# Autenticacion JWT en PrevioMX API

Guia verificada contra `Controllers/AuthController.cs`, `Business/AuthService.cs`, `Business/JwtService.cs` y los DTOs de `PrevioMX_Api/DTO`.

## Flujo implementado

```text
POST /api/Auth/login
  -> AuthService.LoginAsync
  -> AuthDbContext.LoginAsync
  -> EXEC CSP_PMX_Login @P_USUARIO, @P_PASSWORD
  -> JwtService.GenerateToken
```

El login es el unico flujo de autenticacion operativo hoy. `register` y `refresh` existen como rutas publicas, pero el servicio retorna `null` porque faltan los stored procedures/implementacion productiva.

## Configuracion JWT

`Program.cs` lee la seccion `JwtSettings`:

```json
{
  "JwtSettings": {
    "SecretKey": "<secreto>",
    "Issuer": "PrevioMX_API",
    "Audience": "PrevioMX_Web",
    "ExpirationMinutes": 1440,
    "RefreshTokenExpirationDays": 7
  }
}
```

No documentes ni copies secretos reales. En ambientes productivos, `SecretKey` debe provenir de variables de entorno o un gestor de secretos.

La validacion JWT exige:

- issuer configurado;
- audience configurado;
- firma HMAC SHA-256 con `SecretKey`;
- token vigente (`ClockSkew = TimeSpan.Zero`).

## Login

**POST** `/api/Auth/login`

Request (`LoginRequest.cs`):

```json
{
  "usuario": "USUARIO.MTY",
  "password": "password"
}
```

Respuesta (`AuthResponse.cs`):

```json
{
  "token": "jwt",
  "refreshToken": "refresh_token",
  "user": {
    "idUsuario": "YRO",
    "usuario": "usuario.mty",
    "correoElectronico": "usuario@dominio",
    "equipo": "MANCHESTER",
    "grupoId": "guid",
    "lider": "usuario.mty"
  }
}
```

Errores:

- `400`: body invalido segun `ModelState`.
- `401`: credenciales invalidas o `CSP_PMX_Login` no devolvio usuario.

## Claims generados

`JwtService.GenerateToken` crea estos claims desde `LoginResultDto`:

| Claim | Origen | Uso conocido |
| --- | --- | --- |
| `ClaimTypes.NameIdentifier` | `IdUsuario` | Cierre de previo toma `idUsuario` desde el JWT. |
| `ClaimTypes.Email` | `CorreoElectronico` | Diagnostico y endpoints protegidos de prueba. |
| `ClaimTypes.Name` | `Usuario` | Identidad del usuario. |
| `Equipo` | `Equipo` | El frontend tambien guarda `user.equipo` desde la respuesta de login. |
| `GrupoId` | `GrupoId` | Disponible para reglas futuras. |
| `Lider` | `Lider` | Disponible para reglas futuras. |
| `jti` | GUID generado | Identificador unico del token. |

## Uso del token

Enviar el JWT en todos los endpoints protegidos:

```http
Authorization: Bearer <token>
```

Ejemplo:

```bash
TOKEN="<token devuelto por login>"

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

En Swagger:

1. Ejecuta `POST /api/Auth/login`.
2. Copia `token`.
3. Usa **Authorize** con `Bearer {token}`.
4. Prueba controllers protegidos como `Visualization`, `Catalogos`, `Clasificacion` o `Protected`.

## Rutas publicas expuestas pero no operativas

| Ruta | Estado real | Resultado actual |
| --- | --- | --- |
| `POST /api/Auth/register` | No implementada en `AuthService.RegisterAsync` | El controller responde `409 Conflict` cuando el servicio retorna `null`. |
| `POST /api/Auth/refresh` | No implementada en `AuthService.RefreshTokenAsync` | El controller responde `401 Unauthorized` cuando el servicio retorna `null`. |

El frontend no depende de refresh token: `api.service.js` detecta expiracion del JWT, limpia `localStorage` y redirige al login.

## Troubleshooting

### 401 por token faltante

Verifica que el header sea exactamente:

```http
Authorization: Bearer <token>
```

### 401 por token expirado

El `ClockSkew` esta en cero; no hay periodo de gracia. Inicia sesion de nuevo.

### 401 por firma invalida

La `SecretKey` usada al generar el token debe ser la misma que valida la API en ejecucion.

### El dashboard carga vacio despues de login

El dashboard usa `user.equipo` de la respuesta de login para llamar `GET /api/Visualization/pendientes/{equipo}`. Revisa que `CSP_PMX_Login` devuelva `Equipo`.
