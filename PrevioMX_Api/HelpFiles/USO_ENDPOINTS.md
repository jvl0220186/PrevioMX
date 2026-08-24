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

> El `refreshToken` de login no se envía en `Authorization`. El frontend actual no renueva sesión; si el JWT expira, `api.service.js` limpia `token`, `user` y `captureData` y redirige al login (`basename /PrevioMX/`).

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

Solo cuando `detalle-entrada` indica `esOpenPO = true` (el frontend usa `detalleItems[0].esOpenPO`).

### POST `/api/Visualization/agregar-openpo`

```json
{
  "referencia": "REF123",
  "po": "PO123",
  "packing": "PACKING-01"
}
```

El controller exige `referencia`, `po` y `packing` (mensaje de error tipográfico: `"Paking es requerido"`). En la UI, `AddPartidasForm` solo bloquea el submit si falta `po`; un packing vacío llega al API y falla con 400.

### GET `/api/Visualization/proveedor-previo/{referencia}`

Confirma el proveedor asociado al previo al entrar a captura. Resultset mapeado: `idProveedor`, `proveedor`, `estatus`, `msg`.

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

Resultset: `Valido` (bool).

### POST `/api/Protected/valida-token-teamleader`

Autoriza diferencias contra Standard Pack o cambios sensibles. Un 401/403 de este endpoint no redirige al login (excepción en `api.service.js`).

## Cierre de previo

### GET `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}`

El `idUsuario` se toma del claim `ClaimTypes.NameIdentifier` del JWT. Si el claim falta, responde `401`.

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

Notas:

- Las credenciales de reapertura no deben asumirse iguales al login principal.
- `AuthDbContext.PuedeReabrirPrevio` llama `sp_previo_TL` con `@REIMPRESION = 0`. Si el SP regresa alguna fila, mapea `usuario` desde el reader, `puedeRegenerar = true` y `lUsuario = ""` (los campos del reader para esos dos valores están comentados en código).

## PDF y OCR

### GET `/api/Visualization/pdf-proxy?url={url}`

Proxy usado por `PdfOcrViewer` para PDFs cross-origin.

Restricciones:

- Solo URLs `https`.
- Hosts: `grupoei.com.mx`, `aduax.com`, subdominios, y hosts que terminen en `.amazonaws.com`.
- Timeout HTTP: 30 s; errores remotos responden `502`.
- Host no permitido responde `403`. En el SPA, `api.service.js` trata casi cualquier `403` como sesión inválida y redirige al login (excepto Team Leader).

## Catálogos

### GET `/api/Catalogos/{catalogo}`

Hardcodeados en `CaptureView`:

- `1`: unidades
- `2`: países

Columnas SQL mapeadas: `c_value` → `cValue`, `c_text` → `cText`.

### POST `/api/Catalogos/catalogo-proveedores`

```json
{
  "filtro": "texto",
  "pageNumber": 1,
  "pageSize": 20
}
```

Notas:

- El DTO `CatalogoPagiandoRequest` usa `pageNumber = 1` y `pageSize = 10` por defecto.
- `ProveedoresCombo` envía páginas empezando en `0` y `pageSize = 20`.
- `CatalogosService` calcula `More = page < totalPages` (asume `pageNumber` 1-based). Si el cliente manda `0` y hay una sola página, `More` queda `true` y el combo intentará cargar la página `1`.
- El frontend no permite cambiar proveedor si ya existen partidas capturadas.

## Cuarentenas

### POST `/api/Visualization/validar-cuarentenas`

Endpoint de API existente; hoy **no** hay cliente en `previo.service.js`.

```json
{
  "idEntrada": "REF123",
  "idUsuario": "YRO"
}
```

El controller solo valida que `idUsuario` no esté vacío. Ejecuta `CSP_PMX_ValidarCuarentenas`. `Success` es `true` solo si hay filas y **todas** tienen `EXITO = true`.

## CORS y entornos

`Program.cs` permite orígenes:

- `http://localhost:5173`
- `http://localhost:3000`
- `http://localhost:5000`

No hay orígenes de preproducción/producción en la política. Un SPA hospedado en otro dominio necesita ampliar CORS o servir API/web bajo un esquema compatible.

## Scaffold legacy

`GET /WeatherForecast` sigue existiendo (sin prefijo `/api`) y requiere JWT, pero no forma parte del flujo de negocio de PrevioMX.
