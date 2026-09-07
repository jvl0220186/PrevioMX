# Endpoints de PrevioMX API

Rutas ASP.NET son case-insensitive. El frontend usa PascalCase (`/api/Auth`, `/api/Visualization`). Todos los de negocio excepto `Auth` llevan `[Authorize]`.

Base local: `https://localhost:5001` (perfil `https`) o `http://localhost:5000` (perfil `http`).

## Públicos (`[AllowAnonymous]`)

### POST `/api/Auth/login`

Único login implementado. Body: `{ "usuario": "...", "password": "..." }`.

**200** — `AuthResponse`:

```json
{
  "token": "eyJ...",
  "refreshToken": "<aleatorio; no se persiste>",
  "user": {
    "idUsuario": "...",
    "usuario": "...",
    "correoElectronico": "...",
    "equipo": "...",
    "grupoId": "...",
    "lider": "..."
  }
}
```

**401** — `{ "message": "Credenciales inválidas" }` si `CSP_PMX_Login` no devuelve fila.

El UI de login etiqueta el campo como “Email”, pero Axios envía `usuario`. `CSP_PMX_Login` recibe `@P_USUARIO` / `@P_PASSWORD`.

### POST `/api/Auth/register`

Ruta viva; `AuthService.RegisterAsync` siempre retorna `null` → **409** `{ "message": "El email ya está registrado" }`. Body esperado: `{ email, password, name }`.

### POST `/api/Auth/refresh`

Ruta viva; `RefreshTokenAsync` siempre retorna `null` → **401** `{ "message": "Refresh token inválido o expirado" }`. `RefreshTokenExpirationDays` de `appsettings` no se usa.

## Catálogos (`[Authorize]`)

### GET `/api/Catalogos/{catalogo}`

`CSP_PMX_Catalogos @P_CATALOGO`. Items: `cValue` / `cText` (columnas SQL `c_value` / `c_text`).

IDs usados por `CaptureView`:

| ID | Uso en UI |
|---|---|
| `1` | Unidades de medida |
| `2` | Países de origen |

### POST `/api/Catalogos/catalogo-proveedores`

Body: `{ "filtro": "", "pageNumber": 1, "pageSize": 10 }`.

`CatalogoPagiandoRequest.PageNumber` default = `1`. `ProveedoresCombo` empieza en `0`. `More` se calcula como `page < totalPages` (1-based); con página `0` y una sola página, `More` queda `true`. Cada fila del SP trae `TotalRows`.

## Visualización (`[Authorize]`)

| Método | Ruta | SP / notas |
|---|---|---|
| GET | `/api/Visualization/pendientes/{equipo}` | `CSP_PMX_ObtenerPendientes`. Docs en `ruta_documento` separados por `\|`. |
| GET | `/api/Visualization/detalle-entrada/{idEntrada}` | `CSP_PMX_DetalleEntrada`. Incluye `EsOpenPO`, `MMS`. |
| GET | `/api/Visualization/detalle-pos/{idEntrada}` | `CSP_PMX_DetallePOs`. |
| GET | `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `idUsuario` sale del claim `NameIdentifier`. `CSP_PMX_ValidarCierrePrevio`. |
| POST | `/api/Visualization/registrar-partida` | Requiere `idBulto`, `idProducto`. `csp_PMX_RegistrarPartida`. Campo `mms`. |
| PUT | `/api/Visualization/actualizar-partida` | Requiere `id > 0`, `idBulto`, `idProducto`. `csp_PMX_ActualizarPartida`. |
| DELETE | `/api/Visualization/eliminar-partida` | **Body JSON** (`id`, `idBulto`, `referencia`, `idProducto`). No query string. `csp_PMX_EliminarPartida`. |
| POST | `/api/Visualization/agregar-openpo` | Requiere `referencia`, `po`, `packing` (mensaje de error: “Paking”). `csp_PMX_AgregarOpenPO`. |
| POST | `/api/Visualization/validar-cuarentenas` | Body `{ idEntrada, idUsuario }`. Solo valida `idUsuario` no vacío. **Sin cliente frontend.** |
| POST | `/api/Visualization/validar-marca` | `csp_PMX_ValidaMarca` → `{ valido }`. |
| POST | `/api/Visualization/validar-modelo` | `csp_PMX_ValidaModelo` → `{ valido }`. |
| GET | `/api/Visualization/existe-previo-cerrado/{referencia}` | `csp_PMX_ExistePrevioCerrado` → `{ estatus, msg }`. |
| GET | `/api/Visualization/proveedor-previo/{referencia}` | `csp_PMX_GetProveedorPrevio`. |
| POST | `/api/Visualization/puede-reabrir-previo` | Body `LoginRequest`. `sp_previo_TL` con `@REIMPRESION=0`. Si hay fila: `puedeRegenerar=true`, `lUsuario=""`. |
| GET | `/api/Visualization/reabre-previo/{referencia}` | `csp_PMX_ReabrirPrevio`. **404** si no hay fila. |
| GET | `/api/Visualization/pdf-proxy?url=` | Solo HTTPS. Hosts: `grupoei.com.mx`, `*.grupoei.com.mx`, `aduax.com`, `*.aduax.com`, `*.amazonaws.com`. Timeout 30s. **403** host denegado; **502** fallo remoto. |

### Registrar / actualizar partida (body)

```json
{
  "idBulto": "...",
  "referencia": "...",
  "idProveedor": "...",
  "idProducto": "...",
  "um": "...",
  "cantidad": "...",
  "subCantidad": "...",
  "paisOrigen": "...",
  "comentarios": "...",
  "usuario": "...",
  "ocCompra": "...",
  "noParteFisico": "...",
  "mms": "marca|modelo|serie~marca2|modelo2|serie2"
}
```

`actualizar-partida` añade `id` (int > 0).

## Clasificación (`[Authorize]`)

Solo dos rutas, ambas POST, mismo SP `CSP_PMX_ValidarClasificacion`:

- `POST /api/Clasificacion/validar`
- `POST /api/Clasificacion/validar-post`

Body: `{ "idEntrada": "...", "idProducto": "..." }`.

Respuesta: `clasificacion`, `descripcion`, `isSpum`/`spUm`, `isSppo`/`spPo`, `isSpmms`/`spMms`, `spCantidades`, `isRrmms`.

No existe GET `/api/Clasificacion/{idEntrada}/{idProducto}`.

## Protected (`[Authorize]`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/Protected/test` | Eco de claims JWT. |
| POST | `/api/Protected/valida-token-teamleader` | Body `{ usuario, token }`. `SP_FEA_ValidarTokenTeamleader_Result`. **200** si `correcto==true`; **401** si no (el interceptor web **no** redirige al login). |

## Leftover

`GET /WeatherForecast` (`[Authorize]`) es plantilla. No usarlo como guía de negocio.

## Errores de auth

- **401** token faltante / inválido / expirado (`ClockSkew = 0`).
- **403** en `pdf-proxy` = host no permitido, no “sin rol”. El frontend lo trata como logout.
