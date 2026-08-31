# Formato del token JWT

## Header correcto

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<firma>
```

- Un espacio después de `Bearer`.
- Sin comillas, sin `refreshToken`, sin saltos de línea.
- El token es solo el campo `token` de `POST /api/Auth/login`.

## Incorrecto

```
Authorization: Bearer "eyJ..."
Authorization: "Bearer eyJ..."
Authorization: Bearer  eyJ...          # dos espacios
Authorization: Bearer eyJ...","refreshToken":"..."
```

## Herramientas

**cURL**

```bash
TOKEN="<pegar solo token>"
curl -s "https://localhost:5001/api/Visualization/pendientes/EQUIPO" \
  -H "Authorization: Bearer $TOKEN"
```

**Axios (el cliente real)** — `api.service.js` lee `localStorage.token` y pone `Bearer` solo.

**Postman** — pestaña Authorization → Bearer Token → pegar el JWT **sin** la palabra `Bearer`.

**Swagger** — ver [SWAGGER_AUTENTICACION.md](SWAGGER_AUTENTICACION.md). En el diálogo hay que escribir `Bearer {token}` porque el scheme es `ApiKey`.

## jwt.io

Comprobar:

- `alg`: HS256
- `iss`: `PrevioMX_API`
- `aud`: `PrevioMX_Web`
- `exp` no vencido (en repo: 1440 minutos desde la emisión)

## Fallos frecuentes

| Mensaje | Causa |
|---------|-------|
| Firma inválida | `SecretKey` distinta o token truncado |
| Token expirado | `exp` pasado; `ClockSkew` es 0 |
| Issuer/Audience inválido | Token no generado por esta API |
| Se requiere autenticación | Header ausente o mal formado |
