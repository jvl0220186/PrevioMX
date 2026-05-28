# Autenticacion JWT en PrevioMX API

La API usa JWT para proteger los controladores de negocio (`Visualization`,
`Catalogos`, `Clasificacion` y `Protected`). La fuente de verdad es:

- `Program.cs`: configuracion de autenticacion, CORS y Swagger.
- `Business/AuthService.cs`: login y estado de register/refresh.
- `Business/JwtService.cs`: claims y expiracion del token.
- `Business/AuthDbContext.cs`: ejecucion del stored procedure de login.

## Configuracion

`appsettings.json` debe incluir:

```json
{
  "JwtSettings": {
    "SecretKey": "clave-segura-minimo-32-caracteres",
    "Issuer": "PrevioMX_API",
    "Audience": "PrevioMX_Web",
    "ExpirationMinutes": 1440,
    "RefreshTokenExpirationDays": 7
  }
}
```

`Program.cs` valida issuer, audience, lifetime y firma. Tambien usa `ClockSkew = 0`, por
lo que el token expira exactamente en el minuto configurado.

## Endpoints de autenticacion

### POST `/api/Auth/login`

Autentica contra `CSP_PMX_Login`.

Request:

```json
{
  "usuario": "YROSALES.MTY",
  "password": "..."
}
```

Response 200:

```json
{
  "token": "eyJhbGciOi...",
  "refreshToken": "valor-generado",
  "user": {
    "idUsuario": "YRO",
    "usuario": "yrosales.mty",
    "correoElectronico": "yrosales.mty@grupoei.com.mx",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "yrosales.mty"
  }
}
```

Response 401:

```json
{
  "message": "Credenciales invalidas"
}
```

### POST `/api/Auth/register`

El endpoint existe en `AuthController`, pero `AuthService.RegisterAsync` devuelve `null`.
Actualmente responde `409 Conflict` y no registra usuarios hasta que se implemente el
stored procedure y la logica de servicio.

### POST `/api/Auth/refresh`

El endpoint existe en `AuthController`, pero `AuthService.RefreshTokenAsync` devuelve
`null`. Actualmente responde `401 Unauthorized`; el frontend debe volver a login cuando
el JWT expira.

## Claims incluidos en el JWT

`JwtService.GenerateToken` emite los siguientes claims desde `LoginResultDto`:

| Claim | Fuente | Uso conocido |
| --- | --- | --- |
| `ClaimTypes.NameIdentifier` | `IdUsuario` | `validar-cierre-previo` obtiene aqui el usuario que cierra el previo. |
| `ClaimTypes.Email` | `CorreoElectronico` | Diagnostico/identidad. |
| `ClaimTypes.Name` | `Usuario` | Identidad del usuario. |
| `Equipo` | `Equipo` | El frontend guarda el equipo para cargar pendientes por equipo. |
| `GrupoId` | `GrupoId` | Datos de autorizacion disponibles para reglas futuras. |
| `Lider` | `Lider` | Datos de equipo/liderazgo disponibles para reglas futuras. |
| `jti` | GUID generado | Identificador unico del token. |

## Uso del token

```http
Authorization: Bearer {token}
```

Ejemplo con cURL:

```bash
curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

En Swagger:

1. Ejecuta `POST /api/Auth/login`.
2. Copia `token`.
3. Presiona **Authorize**.
4. Ingresa `Bearer {token}`.
5. Ejecuta endpoints protegidos.

## CORS y clientes permitidos

La politica `AllowFrontend` en `Program.cs` permite:

- `http://localhost:5173` (Vite)
- `http://localhost:3000`
- `http://localhost:5000`

Si el frontend se sirve desde otro origen en desarrollo, hay que agregarlo a esta lista.

## Troubleshooting

- **401 "Se requiere autenticacion"**: falta el header `Authorization` o no usa el
  formato `Bearer {token}`.
- **401 por expiracion**: `ExpirationMinutes` vencio; hacer login de nuevo.
- **401 por firma invalida**: la `SecretKey` usada para generar el token no coincide con
  la que valida la API.
- **Login devuelve 401**: `CSP_PMX_Login` no devolvio usuario para las credenciales.
- **Register/refresh no funcionan**: endpoints declarados, pero no implementados en
  `AuthService`.
