# cURL correcto para endpoints protegidos

Los endpoints protegidos solo aceptan el JWT en el header `Authorization`. No incluyas el
`refreshToken`, objetos JSON completos, comillas extra ni saltos de linea dentro del token.

## Obtener token

```bash
curl -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "YROSALES.MTY",
    "password": "..."
  }'
```

Copia solo el valor de `token`:

```json
{
  "token": "eyJhbGciOi...",
  "refreshToken": "valor-generado",
  "user": {
    "equipo": "MANCHESTER"
  }
}
```

## Usar token en un endpoint protegido

```bash
TOKEN="eyJhbGciOi..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

## Formato correcto del header

```http
Authorization: Bearer {token_completo}
```

Correcto:

```http
Authorization: Bearer eyJhbGciOi...
```

Incorrecto:

```http
Authorization: Bearer "eyJhbGciOi..."
Authorization: "Bearer eyJhbGciOi..."
Authorization: Bearer eyJhbGciOi..., "refreshToken": "..."
Authorization: Bearer  eyJhbGciOi...
```

## Ejemplo: registrar partida

```bash
curl -X POST "https://localhost:5001/api/Visualization/registrar-partida" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idBulto": "BULTO-1",
    "referencia": "REF123",
    "idProveedor": "PROV1",
    "idProducto": "NP-001",
    "um": "PZA",
    "cantidad": "10",
    "subCantidad": "1",
    "paisOrigen": "MEX",
    "comentarios": "",
    "usuario": "YROSALES.MTY",
    "ocCompra": "PO123",
    "noParteFisico": "NP-001",
    "mms": ""
  }'
```

## Si sigue devolviendo 401

1. Vuelve a hacer login; el JWT puede haber expirado.
2. Verifica que no copiaste comillas, espacios o el `refreshToken`.
3. Confirma que la `SecretKey`, `Issuer` y `Audience` coinciden con la configuracion de la API.
4. Revisa logs de API para mensajes de autenticacion JWT.

Nota: aunque la respuesta de login incluye `refreshToken`, el servicio actual no implementa
renovacion funcional; si expira el JWT, vuelve a hacer login.
