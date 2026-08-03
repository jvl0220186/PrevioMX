# Guía de uso de endpoints

Resumen de endpoints reales de la API .NET de PrevioMX y cómo los consume el frontend React. Verificado contra `Controllers/*`, `Business/AuthDbContext.cs` y `PrevioMX_Web/src/services/previo.service.js`.

## Base URL y autenticación

- Desarrollo API: `https://localhost:5001` o `http://localhost:5000` (`Properties/launchSettings.json`).
- Desarrollo web: Vite en `http://localhost:5173`.
- Producción web: `vite.config.js` publica con base `/PrevioMX/`.
- Todos los controladores de negocio usan JWT salvo `AuthController` (`[AllowAnonymous]`).

```http
Authorization: Bearer {token}
```

> El `refreshToken` de login no se envía en `Authorization`. El frontend actual no renueva sesión; si el JWT expira, `api.service.js` limpia `localStorage` y redirige al login.

## Autenticación

### POST `/api/Auth/login`

Valida credenciales con `CSP_PMX_Login` y genera un JWT.

```bash
curl -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "USUARIO.MTY",
    "password": "password"
  }'
```

```json
{
  "token": "eyJ...",
  "refreshToken": "token_de_refresh",
  "user": {
    "idUsuario": "YRO",
    "usuario": "usuario.mty",
    "correoElectronico": "usuario@grupoei.com.mx",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "lider.mty"
  }
}
```

### POST `/api/Auth/register` y POST `/api/Auth/refresh`

Las rutas existen en `AuthController`, pero `AuthService.RegisterAsync` y `AuthService.RefreshTokenAsync` aún devuelven `null`:

- `register` responde `409 Conflict`.
- `refresh` responde `401 Unauthorized`.

No son flujos operativos hasta implementar la lógica.

## Dashboard de pendientes

### GET `/api/Visualization/pendientes/{equipo}`

El dashboard toma `user.equipo` desde `localStorage` y llama este endpoint al cargar.

```bash
TOKEN="eyJ..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

Notas:

- `documentos` se arma a partir de `ruta_documento` separado por `|`.
- El frontend guarda el item seleccionado en `localStorage.captureData` antes de navegar a `/capture/{reference}`.

## Captura de previo

### GET `/api/Visualization/detalle-entrada/{idEntrada}`

Carga bultos y partidas. Incluye banderas `esOpenPO` y campo `mms` por partida.

KPIs en `CaptureView`:

- Total bultos: `count(distinct idBulto)`.
- Capturados: bultos con `idProducto` no vacío.
- Pendientes: total menos capturados.
- Líneas de productos: registros con `idProducto` no vacío.

### POST `/api/Visualization/registrar-partida`

```json
{
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
  "mms": "MARCA|MODELO|SERIE1~MARCA|MODELO|SERIE2"
}
```

`mms` usa `marca|modelo|serie` por entrada y `~` entre series. Vacío (`""`) si no aplica.

Respuesta común:

```json
{
  "estatus": true,
  "msg": "Operacion realizada"
}
```

### PUT `/api/Visualization/actualizar-partida`

Igual que registrar, más `id > 0`. Requiere `idBulto` e `idProducto`.

### DELETE `/api/Visualization/eliminar-partida`

Body JSON (Axios lo envía en `data`):

```json
{
  "id": 10,
  "idBulto": "B1",
  "referencia": "REF123",
  "idProducto": "SKU-001"
}
```

Validación del controller: `IdBulto`, `Referencia` e `IdProducto` son requeridos.

### GET `/api/Visualization/detalle-pos/{idEntrada}`

Solo cuando `detalle-entrada` indica `esOpenPO = true`.

### POST `/api/Visualization/agregar-openpo`

```json
{
  "referencia": "REF123",
  "po": "PO123",
  "packing": "PACKING-01"
}
```

### GET `/api/Visualization/proveedor-previo/{referencia}`

Confirma el proveedor asociado al previo al entrar a captura.

## Validaciones de producto y Standard Pack / MMS

### POST `/api/Clasificacion/validar` y POST `/api/Clasificacion/validar-post`

Ambos ejecutan `CSP_PMX_ValidarClasificacion`. El frontend activo usa `validar-post`.

```json
{
  "idEntrada": "REF123",
  "idProducto": "SKU-001"
}
```

Respuesta relevante (camelCase en JSON):

| Campo | Rol en captura |
| --- | --- |
| `clasificacion` | Debe ser 10 dígitos para considerarse clasificado |
| `isSpum` / `spUm` | Unidad esperada por Standard Pack |
| `isSppo` / `spPo` | País esperado por Standard Pack |
| `isSpmms` | Activa badges/alertas MMS; sin `isRrmms` la captura es opcional |
| `isRrmms` | Hace obligatorio capturar N series = cantidad |
| `spMms` / `spCantidades` | Texto/guía de MMS |

> `previo.service.js` aún contiene `getClasificacion()` hacia `GET /api/Clasificacion/{idEntrada}/{idProducto}`, pero ese endpoint **no existe** en `ClasificacionController`. El flujo real usa `validarPost()`.

### POST `/api/Visualization/validar-marca` / `validar-modelo`

Usados al capturar MMS:

```json
{
  "referencia": "REF123",
  "idProducto": "SKU-001",
  "marca": "MARCA"
}
```

### POST `/api/Protected/valida-token-teamleader`

Autoriza diferencias contra Standard Pack o cambios sensibles. Un 401/403 de este endpoint no redirige al login (excepción en `api.service.js`).

## Cierre de previo

### GET `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}`

El `idUsuario` se toma del claim `ClaimTypes.NameIdentifier` del JWT.

```bash
curl -X GET "https://localhost:5001/api/Visualization/validar-cierre-previo/REF123/false/true" \
  -H "Authorization: Bearer $TOKEN"
```

## Reapertura de previo

1. `GET /api/Visualization/existe-previo-cerrado/{referencia}`
2. `POST /api/Visualization/puede-reabrir-previo` (credenciales vía `sp_previo_TL`)
3. `GET /api/Visualization/reabre-previo/{referencia}`

```json
{
  "usuario": "TEAMLEADER",
  "password": "password"
}
```

Las credenciales de reapertura no deben asumirse iguales al login principal.

## PDF y OCR

### GET `/api/Visualization/pdf-proxy?url={url}`

Proxy usado por `PdfOcrViewer` para PDFs cross-origin.

Restricciones:

- Solo URLs `https`.
- Hosts: `grupoei.com.mx`, `aduax.com`, subdominios, y hosts que terminen en `.amazonaws.com`.
- Timeout HTTP: 30 s; errores remotos responden `502`.

## Catálogos

### GET `/api/Catalogos/{catalogo}`

- `1`: unidades
- `2`: países

### POST `/api/Catalogos/catalogo-proveedores`

```json
{
  "filtro": "texto",
  "pageNumber": 1,
  "pageSize": 20
}
```

`CatalogoPagiandoRequest` usa `pageNumber = 1` y `pageSize = 10` por defecto. El frontend no permite cambiar proveedor si ya existen partidas capturadas.

## Scaffold legacy

`GET /WeatherForecast` sigue existiendo en el proyecto (sin prefijo `/api`) y requiere JWT, pero no forma parte del flujo de negocio de PrevioMX.
