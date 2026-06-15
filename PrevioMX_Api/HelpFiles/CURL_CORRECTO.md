# Comandos cURL para endpoints protegidos

## Obtener token

```bash
curl -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "YROSALES.MTY",
    "password": "123"
  }'
```

Copia solo el valor de `token` de la respuesta. El `refreshToken` no va en el
header `Authorization`; ademas, el refresh no esta implementado actualmente en
`AuthService`.

## Usar token en un endpoint protegido

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

## Formato correcto del header

```http
Authorization: Bearer {token_completo_sin_espacios_ni_comillas}
```

Problemas comunes:

1. Incluir el JSON completo de login en el header.
2. Incluir `refreshToken` junto al JWT.
3. Poner comillas alrededor del token.
4. Usar mas de un espacio despues de `Bearer`.
5. Copiar un token truncado.

## Ejemplos utiles

Validar clasificacion:

```bash
curl -X POST "https://localhost:5001/api/Clasificacion/validar-post" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "idEntrada": "ENTRADA-123",
    "idProducto": "ABC-123"
  }'
```

Cerrar previo:

```bash
curl -X GET "https://localhost:5001/api/Visualization/validar-cierre-previo/ENTRADA-123/false/true" \
  -H "Authorization: Bearer $TOKEN"
```

Proxy PDF:

```bash
curl -L "https://localhost:5001/api/Visualization/pdf-proxy?url=https%3A%2F%2Fvuc.grupoei.com.mx%2Fdocumento.pdf" \
  -H "Authorization: Bearer $TOKEN" \
  --output documento.pdf
```

## Si sigue dando 401

1. Verifica que `TOKEN` contenga solo el JWT.
2. Revisa que no haya expirado. La expiracion efectiva viene de
   `JwtSettings:ExpirationMinutes`.
3. Confirma que el API que valida el token usa el mismo `JwtSettings:SecretKey`,
   `Issuer` y `Audience` con los que se genero.
4. Revisa logs que contengan `Error de autenticacion JWT`.

