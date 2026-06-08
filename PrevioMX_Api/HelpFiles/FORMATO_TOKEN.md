# Formato del token JWT

Los endpoints protegidos esperan un header `Authorization` con el esquema
Bearer:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Correcto

- Un solo espacio despues de `Bearer`.
- Token completo, sin comillas.
- Solo el valor `token` devuelto por `POST /api/Auth/login`.

## Incorrecto

```http
Authorization: Bearer "eyJhbGciOiJIUzI1NiIs..."
Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
Authorization: Bearer  eyJhbGciOiJIUzI1NiIs...
```

Tambien es incorrecto enviar el `refreshToken` o el JSON completo de login como
Bearer token.

## Claims esperados

El token se firma con `HS256`, `iss = PrevioMX_API` y `aud = PrevioMX_Web`. La
API usa estos claims:

- `ClaimTypes.NameIdentifier`: id de usuario; requerido para validar cierre de
  previo.
- `ClaimTypes.Email`: correo electronico.
- `ClaimTypes.Name`: usuario.
- `Equipo`, `GrupoId`, `Lider`: datos de negocio del usuario.
- `jti`: identificador unico del token.

La expiracion se toma de `JwtSettings:ExpirationMinutes` y actualmente esta
configurada en `1440` minutos en `appsettings.json`.

## Diagnostico rapido

| Error | Revision |
| --- | --- |
| Firma invalida | Confirmar que el token no fue truncado y que la API usa la misma `SecretKey` con la que se emitio. |
| Token expirado | Hacer login nuevamente; `refresh` no esta implementado. |
| Issuer o audience invalido | Revisar `JwtSettings:Issuer` y `JwtSettings:Audience`. |
| 401 en cierre de previo | Confirmar que el token contiene `ClaimTypes.NameIdentifier`. |

Ver tambien [AUTENTICACION_JWT.md](AUTENTICACION_JWT.md).
