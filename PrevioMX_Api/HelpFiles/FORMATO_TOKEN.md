# Formato del token JWT

## Header correcto

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Un espacio después de `Bearer`.
- Sin comillas alrededor del token.
- Token completo (tres segmentos `header.payload.signature`).
- El `refreshToken` **no** va en este header.

## Claims a verificar (jwt.io, HS256)

| Claim | Valor esperado |
|---|---|
| `iss` | `PrevioMX_API` |
| `aud` | `PrevioMX_Web` |
| `exp` | Unix time; `ClockSkew = 0` |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` | `IdUsuario` |
| `Equipo` | Equipo para `/pendientes/{equipo}` |

No pegar JWTs reales en esta guía. Obtener uno con `POST /api/Auth/login`.

## Postman / Axios / PDF.js

- Postman pestaña Authorization → Bearer Token: pegar el JWT **sin** la palabra `Bearer`.
- Axios (`api.service.js`) concatena `Bearer ${token}` desde `localStorage.token`.
- El cliente también envía `ngrok-skip-browser-warning: true` (irrelevante fuera de ngrok).
- `PdfOcrViewer` (pdf.js) manda el mismo header **solo** cuando usa `pdf-proxy` (cross-origin). Ese fetch no pasa por Axios.

## Errores

| Mensaje | Causa |
|---|---|
| Firma inválida | `SecretKey` distinta |
| Token expirado | `exp` vencido; no hay refresh implementado |
| Formato inválido | no es `Bearer {jwt}` o el JWT está truncado |
