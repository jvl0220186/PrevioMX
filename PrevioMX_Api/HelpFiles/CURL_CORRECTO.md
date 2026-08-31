# cURL — flujos reales

Perfil local: `https://localhost:5001`. Aceptar el certificado de desarrollo (`-k`) si hace falta.

## 1. Login

```bash
curl -sk -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usuario":"TU.USUARIO","password":"TU_PASSWORD"}'
```

Guardar solo `token`:

```bash
TOKEN="$(curl -sk -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usuario":"TU.USUARIO","password":"TU_PASSWORD"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")"
```

## 2. Pendientes del equipo

```bash
curl -sk "https://localhost:5001/api/Visualization/pendientes/EQUIPO" \
  -H "Authorization: Bearer $TOKEN"
```

## 3. Clasificación (ruta viva)

```bash
curl -sk -X POST "https://localhost:5001/api/Clasificacion/validar-post" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"idEntrada":"ENT-001","idProducto":"NP-123"}'
```

## 4. Registrar partida

`mms` vacío o `marca|modelo|serie~...`.

```bash
curl -sk -X POST "https://localhost:5001/api/Visualization/registrar-partida" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idBulto":"B-1",
    "referencia":"ENT-001",
    "idProveedor":"P-1",
    "idProducto":"NP-123",
    "um":"PZA",
    "cantidad":"2",
    "subCantidad":"0",
    "paisOrigen":"CN",
    "comentarios":"",
    "usuario":"TU.USUARIO",
    "ocCompra":"PO-1",
    "noParteFisico":"",
    "mms":"ACME|X1|SN001~ACME|X1|SN002"
  }'
```

## 5. Eliminar partida (DELETE + body)

```bash
curl -sk -X DELETE "https://localhost:5001/api/Visualization/eliminar-partida" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":10,"idBulto":"B-1","referencia":"ENT-001","idProducto":"NP-123"}'
```

## 6. OpenPO

`packing` es obligatorio en API (typo del mensaje: `"Paking es requerido"`).

```bash
curl -sk -X POST "https://localhost:5001/api/Visualization/agregar-openpo" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"referencia":"ENT-001","po":"PO-99","packing":"PK-1"}'
```

## Errores de header

No concatenar `refreshToken` al Bearer. No usar `WeatherForecast` como ejemplo de negocio: existe, pero no toca Aduasis.

Si 401: token vencido (1440 min), `SecretKey` distinta, o falta `Bearer `.
