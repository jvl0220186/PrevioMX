# Endpoints de PrevioMX API

Prefijo de controladores: `api/[controller]`. JSON camelCase por defecto de ASP.NET.

Casi todo requiere JWT salvo `POST /api/Auth/*` (`[AllowAnonymous]`).

## Auth — `api/Auth`

| Método | Ruta | Auth | Resultado real |
|--------|------|------|----------------|
| POST | `/api/Auth/login` | No | 200 + token / 401 credenciales |
| POST | `/api/Auth/register` | No | Siempre **409** (no implementado) |
| POST | `/api/Auth/refresh` | No | Siempre **401** (no implementado) |

Login: ver [AUTENTICACION_JWT.md](AUTENTICACION_JWT.md).

## Catálogos — `api/Catalogos` `[Authorize]`

### `GET /api/Catalogos/{catalogo}`

`CSP_PMX_Catalogos @P_CATALOGO`.

La captura usa `1` (UM) y `2` (países).

```json
{ "items": [ { "cValue": "PZA", "cText": "Pieza" } ] }
```

### `POST /api/Catalogos/catalogo-proveedores`

```json
{ "filtro": "acme", "pageNumber": 1, "pageSize": 20 }
```

Default DTO: `pageNumber=1`, `pageSize=10`. Respuesta: `items`, `page`, `size`, `totalRecords`, `totalPages`, `more`.

`ProveedoresCombo` envía `pageNumber` desde **0**. Ver [CONFIGURACION_BD.md](CONFIGURACION_BD.md).

## Clasificación — `api/Clasificacion` `[Authorize]`

Solo hay **dos** rutas; ambas llaman el mismo SP:

| Método | Ruta |
|--------|------|
| POST | `/api/Clasificacion/validar` |
| POST | `/api/Clasificacion/validar-post` |

**No existe** `GET /api/Clasificacion/{idEntrada}/{idProducto}`. El helper `previoService.getClasificacion()` está muerto. La UI usa `validarPost()`.

```json
{ "idEntrada": "ENT-001", "idProducto": "NP-123" }
```

200: `clasificacion`, `descripcion`, `isSpum`, `spUm`, `isSppo`, `spPo`, `isSpmms`, `spMms`, `spCantidades`, `isRrmms`.

400 si faltan ids. 404 si el SP no devuelve fila.

## Visualización — `api/Visualization` `[Authorize]`

### Lectura

| Método | Ruta | SP / lógica |
|--------|------|-------------|
| GET | `/pendientes/{equipo}` | `CSP_PMX_ObtenerPendientes` |
| GET | `/detalle-entrada/{idEntrada}` | `CSP_PMX_DetalleEntrada` |
| GET | `/detalle-pos/{idEntrada}` | `CSP_PMX_DetallePOs` |
| GET | `/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `CSP_PMX_ValidarCierrePrevio`; `idUsuario` sale del claim `NameIdentifier` |
| GET | `/existe-previo-cerrado/{referencia}` | `csp_PMX_ExistePrevioCerrado` |
| GET | `/proveedor-previo/{referencia}` | `csp_PMX_GetProveedorPrevio` |
| GET | `/reabre-previo/{referencia}` | `csp_PMX_ReabrirPrevio` → `PendienteDto` |
| GET | `/pdf-proxy?url=` | Proxy HTTPS; ver abajo |

### Mutaciones de partida

| Método | Ruta | Body mínimo |
|--------|------|-------------|
| POST | `/registrar-partida` | `idBulto`, `idProducto` (+ referencia, proveedor, UM, cantidad, subCantidad, paisOrigen, comentarios, usuario, ocCompra, noParteFisico, mms) |
| PUT | `/actualizar-partida` | igual + `id` > 0 |
| DELETE | `/eliminar-partida` | JSON body: `id`, `idBulto`, `referencia`, `idProducto` (no query string) |

Respuesta típica: `{ "estatus": true, "msg": "..." }`.

MMS en payload: `marca|modelo|serie` unidos con `~`. Ejemplo: `ACME|X1|SN001~ACME|X1|SN002`.

### OpenPO, validaciones, reapertura

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/agregar-openpo` | Requiere `referencia`, `po` y **`packing`** (400 si packing vacío). La UI solo exige `po` y puede enviar `packing: ""`. |
| POST | `/validar-marca` | `{ referencia, idProducto, marca }` → `{ valido }` |
| POST | `/validar-modelo` | `{ referencia, idProducto, modelo }` → `{ valido }` |
| POST | `/validar-cuarentenas` | `{ idEntrada, idUsuario }` — **sin cliente** en `previo.service.js` |
| POST | `/puede-reabrir-previo` | Body `LoginRequest` (`usuario`, `password`). Si el SP devuelve fila: `puedeRegenerar` siempre `true` |

### `GET /api/Visualization/pdf-proxy?url=`

- Solo `https` absoluto.
- Hosts: `grupoei.com.mx` y subdominios, `aduax.com` y subdominios, `*.amazonaws.com`.
- 403 host denegado; 502 error remoto o timeout 30 s.
- El frontend (`PdfOcrViewer`) usa el proxy cuando el PDF es cross-origin, con Bearer. Un 403 aquí dispara logout (interceptor Axios).

## Otros

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/WeatherForecast` | Smoke JWT. No es negocio. |
| GET | `/api/Protected/test` | Eco de claims. |
| POST | `/api/Protected/valida-token-teamleader` | `{ usuario, token }` → `SP_FEA_ValidarTokenTeamleader_Result`. 401 de este path **no** cierra sesión. |

## Errores HTTP comunes

| Código | Cuándo |
|--------|--------|
| 400 | Validación de body/ruta (ids vacíos, packing, etc.) |
| 401 | JWT ausente/inválido/expirado, o login fallido |
| 403 | Host no permitido en `pdf-proxy` |
| 404 | SP sin fila (clasificación, marca/modelo, reabrir) |
| 409 | `register` (siempre) |
| 500 | Excepción al ejecutar SP |
| 502 | Fallo del origen en `pdf-proxy` |
