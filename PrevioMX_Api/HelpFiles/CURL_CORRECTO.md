# cURL correcto para endpoints protegidos

Esta guía corrige errores comunes al probar endpoints JWT de PrevioMX con cURL. Usa endpoints reales de la aplicación en lugar de rutas de prueba.

## Obtener un token

```bash
curl -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "USUARIO.MTY",
    "password": "password"
  }'
```

Copia solamente el valor del campo `token`:

```json
{
  "token": "eyJ...",
  "refreshToken": "token_de_refresh",
  "user": {
    "idUsuario": "YRO",
    "usuario": "usuario.mty",
    "equipo": "MANCHESTER"
  }
}
```

## Incorrecto

```bash
curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H 'Authorization: Bearer eyJ...", "refreshToken": "abc..."'
```

Problemas:

1. El header incluye contenido JSON, comillas o texto adicional.
2. El `refreshToken` no va en `Authorization`.
3. El valor debe ser un JWT completo, sin saltos de linea ni espacios extra.

## Correcto

```bash
TOKEN="eyJ..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

Formato exacto:

```http
Authorization: Bearer {token_jwt}
```

## Ejemplos utiles

### Ver pendientes del equipo

```bash
curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

### Ver detalle de una entrada

```bash
REFERENCIA="REF123"

curl -X GET "https://localhost:5001/api/Visualization/detalle-entrada/$REFERENCIA" \
  -H "Authorization: Bearer $TOKEN"
```

### Registrar una partida

```bash
curl -X POST "https://localhost:5001/api/Visualization/registrar-partida" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idBulto": "B1",
    "referencia": "REF123",
    "idProveedor": "P001",
    "idProducto": "SKU-001",
    "um": "PZA",
    "cantidad": "10",
    "subCantidad": "1",
    "paisOrigen": "MEX",
    "comentarios": "Sin observaciones",
    "usuario": "USUARIO.MTY",
    "ocCompra": "PO123",
    "noParteFisico": "SKU-001",
    "mms": ""
  }'
```

### Validar clasificación / Standard Pack

```bash
curl -X POST "https://localhost:5001/api/Clasificacion/validar-post" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idEntrada": "REF123",
    "idProducto": "SKU-001"
  }'
```

La respuesta puede incluir `isSpmms` e `isRrmms` para guiar la captura de MMS.

### Eliminar una partida

```bash
curl -X DELETE "https://localhost:5001/api/Visualization/eliminar-partida" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 10,
    "idBulto": "B1",
    "referencia": "REF123",
    "idProducto": "SKU-001"
  }'
```

### Cerrar previo

```bash
curl -X GET "https://localhost:5001/api/Visualization/validar-cierre-previo/REF123/false/true" \
  -H "Authorization: Bearer $TOKEN"
```

El backend toma el usuario del JWT, no de la URL.

### Agregar OpenPO

```bash
curl -X POST "https://localhost:5001/api/Visualization/agregar-openpo" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "referencia": "REF123",
    "po": "PO123",
    "packing": "PACKING-01"
  }'
```

`packing` es obligatorio en el API aunque la UI solo valide `po` en cliente.

### Validar cuarentenas (solo API)

```bash
curl -X POST "https://localhost:5001/api/Visualization/validar-cuarentenas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idEntrada": "REF123",
    "idUsuario": "YRO"
  }'
```

Hoy no hay wrapper en `previo.service.js`.

### Proxy de PDF

```bash
PDF_URL="https://vuc.grupoei.com.mx/vucem/files/packing.pdf"

curl -L "https://localhost:5001/api/Visualization/pdf-proxy?url=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$PDF_URL")" \
  -H "Authorization: Bearer $TOKEN" \
  --output packing.pdf
```

El proxy solo acepta HTTPS y hosts permitidos por `VisualizationController`.

## Si recibes 401

1. Repite login y actualiza `TOKEN`; el JWT expira y no hay refresh funcional en el frontend actual.
2. Verifica que `Authorization` tenga exactamente `Bearer ` mas el JWT.
3. Confirma que el token no esta truncado.
4. Revisa que `JwtSettings:Issuer`, `Audience` y `SecretKey` coincidan entre quien emite y quien valida el token.

## Si recibes 403 en `pdf-proxy`

La URL del PDF puede tener un host no permitido. El controlador solo acepta:

- `grupoei.com.mx` y subdominios.
- `aduax.com` y subdominios.
- Hosts que terminen en `.amazonaws.com`.
