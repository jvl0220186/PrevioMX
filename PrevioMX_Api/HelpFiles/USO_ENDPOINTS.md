# Guia de uso de endpoints

Esta guia muestra el flujo minimo para usar la API desde un cliente externo. Para el
detalle completo de captura y visualizacion, consulta
`HelpFiles/VISUALIZACION_ENDPOINTS.md`.

## 1. Login

`POST /api/Auth/login` no requiere JWT.

```bash
curl -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "YROSALES.MTY",
    "password": "..."
  }'
```

Respuesta esperada:

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

Guarda `token` para las peticiones protegidas. Guarda `user.equipo` si necesitas consultar
pendientes.

## 2. Enviar el JWT

Todos los endpoints de `Visualization`, `Catalogos`, `Clasificacion` y `Protected`
requieren:

```http
Authorization: Bearer {token}
```

Ejemplo:

```bash
TOKEN="eyJhbGciOi..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

## 3. Flujo de consulta y captura

### Consultar pendientes

```bash
curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

### Consultar detalle de entrada

```bash
curl -X GET "https://localhost:5001/api/Visualization/detalle-entrada/REF123" \
  -H "Authorization: Bearer $TOKEN"
```

### Cargar catalogos usados por captura

```bash
# 1 = unidades, 2 = paises
curl -X GET "https://localhost:5001/api/Catalogos/1" \
  -H "Authorization: Bearer $TOKEN"

curl -X GET "https://localhost:5001/api/Catalogos/2" \
  -H "Authorization: Bearer $TOKEN"
```

### Validar clasificacion y Standard Pack

```bash
curl -X POST "https://localhost:5001/api/Clasificacion/validar-post" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idEntrada": "REF123",
    "idProducto": "NP-001"
  }'
```

La respuesta puede incluir `clasificacion`, `descripcion`, `isSpum`, `spUm`, `isSppo`,
`spPo`, `isSpmms`, `spMms`, `spCantidades` e `isRrmms`.

### Registrar partida

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

### Cerrar previo

```bash
curl -X GET "https://localhost:5001/api/Visualization/validar-cierre-previo/REF123/false/false" \
  -H "Authorization: Bearer $TOKEN"
```

El usuario que cierra el previo se toma del claim `NameIdentifier` del JWT.

## Endpoints operativos relevantes

| Uso | Endpoint |
| --- | --- |
| Proveedores paginados | `POST /api/Catalogos/catalogo-proveedores` |
| Detalle OpenPO | `GET /api/Visualization/detalle-pos/{idEntrada}` |
| Agregar OpenPO | `POST /api/Visualization/agregar-openpo` |
| Validar token Team Leader | `POST /api/Protected/valida-token-teamleader` |
| Verificar previo cerrado | `GET /api/Visualization/existe-previo-cerrado/{referencia}` |
| Validar reapertura | `POST /api/Visualization/puede-reabrir-previo` |
| Reabrir previo | `GET /api/Visualization/reabre-previo/{referencia}` |
| Proxy de PDF | `GET /api/Visualization/pdf-proxy?url={url}` |

## Errores comunes

### 401 Unauthorized

El token no se envio, esta expirado o no usa el formato `Bearer {token}`.

### 403 Forbidden en `pdf-proxy`

La URL del PDF no es HTTPS o el host no esta permitido por
`VisualizationController.GetPdfProxy`.

### Register/refresh

`POST /api/Auth/register` y `POST /api/Auth/refresh` existen en el controlador, pero el
servicio actual no los implementa. Para renovar sesion, hacer login nuevamente.

## Swagger

1. Abre `https://localhost:5001/swagger`.
2. Ejecuta `POST /api/Auth/login`.
3. Copia `token`.
4. Presiona **Authorize** e ingresa `Bearer {token}`.
5. Prueba los endpoints protegidos.
