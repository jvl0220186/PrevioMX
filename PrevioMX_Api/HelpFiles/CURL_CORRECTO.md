# cURL para endpoints protegidos

Usa siempre el valor del campo `token` como Bearer token. No incluyas el objeto
JSON completo ni el `refreshToken` en el header `Authorization`.

## Obtener token

```bash
API=https://localhost:5001

curl -X POST "$API/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "YROSALES.MTY",
    "password": "password"
  }'
```

Copia solo el valor de `token`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-refresh-token",
  "user": {
    "idUsuario": "123",
    "usuario": "YROSALES.MTY",
    "equipo": "MANCHESTER"
  }
}
```

## Llamar endpoint protegido

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET "$API/api/Visualization/pendientes/MANCHESTER" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

## Formato correcto

```http
Authorization: Bearer <token-jwt-completo>
```

Errores comunes:

- Enviar `refreshToken` en `Authorization`.
- Pegar el JSON completo de login en vez del valor de `token`.
- Agregar comillas, saltos de linea o espacios extra dentro del token.
- Usar un token generado con otra `JwtSettings:SecretKey`.
- Reutilizar un token expirado; `refresh` aun no esta implementado, por lo que
  hay que hacer login de nuevo.

Mas detalles en [AUTENTICACION_JWT.md](AUTENTICACION_JWT.md) y
[USO_ENDPOINTS.md](USO_ENDPOINTS.md).
