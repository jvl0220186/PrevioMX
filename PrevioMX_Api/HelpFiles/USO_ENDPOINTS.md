# Endpoints de PrevioMX API

Rutas ASP.NET son case-insensitive. El frontend usa PascalCase (`/api/Auth`, `/api/Visualization`). Todos los de negocio excepto `Auth` llevan `[Authorize]`.

Base local: `https://localhost:5001` (perfil `https`) o `http://localhost:5000` (perfil `http`). Hay `UseHttpsRedirection()`: un cliente HTTP puede recibir 307.

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

La vista activa (`LoginView.jsx`) etiqueta el campo “Usuario / Correo” (`type="text"`, `name="email"` interno) y Axios envía `usuario`. `CSP_PMX_Login` recibe `@P_USUARIO` / `@P_PASSWORD`. El componente `LoginForm.jsx` (`type="email"`) no está cableado.

`auth.service.js` lanza `error.response?.data` (el objeto `{ message }`, **sin** `status`). `LoginView` compara `err.status === 401`, así que un 401 suele mostrar el mensaje genérico, no “Credenciales incorrectas”.

### POST `/api/Auth/register`

Ruta viva; `AuthService.RegisterAsync` siempre retorna `null` → **409** `{ "message": "El email ya está registrado" }`. Body esperado: `{ email, password, name }`.

### POST `/api/Auth/refresh`

`RefreshTokenAsync` no está implementado: si se llama, retorna `null` → **401** `{ "message": "Refresh token inválido o expirado" }`. Ese 401 solo ocurre cuando el body trae `refreshToken` no vacío.

Si `refreshToken` falta o es `""`, el action responde **400** `{ "message": "Refresh token es requerido" }` y no llama al servicio. Un POST sin body (lo que hace el helper web) lo rechaza `[ApiController]` antes de entrar al action. `RefreshTokenExpirationDays` de `appsettings` no se usa.

`authService.refreshToken()` hace POST **sin** `{ refreshToken }`.

## Catálogos (`[Authorize]`)

### GET `/api/Catalogos/{catalogo}`

`CSP_PMX_Catalogos @P_CATALOGO`. Items: `cValue` / `cText` (columnas SQL `c_value` / `c_text`).

IDs usados por `CaptureView`:

| ID | Uso en UI |
|---|---|
| `1` | Unidades de medida |
| `2` | Países de origen |

La UI concatena el label como `` `[${cValue}] ${cText}` ``.

`CatalogosRequest` (body con `catalogo`) **no se usa**; el id va en la ruta.

### POST `/api/Catalogos/catalogo-proveedores`

Body: `{ "filtro": "", "pageNumber": 1, "pageSize": 10 }`.

`CatalogoPagiandoRequest.PageNumber` default = `1`. `ProveedoresCombo` empieza en `0` (debounce 350 ms, `pageSize` 20). `More` se calcula como `page < totalPages` (1-based); con página `0` y una sola página, `More` queda `true`. Cada fila del SP trae `TotalRows`.

## Visualización (`[Authorize]`)

| Método | Ruta | SP / notas |
|---|---|---|
| GET | `/api/Visualization/pendientes/{equipo}` | `CSP_PMX_ObtenerPendientes`. **400** si `equipo` es blanco. Un GET a `/pendientes/` (sin segmento) no entra al action (404). Docs en `ruta_documento` separados por `\|`. Una URL inválida (`new Uri`) tumba el listado. La UI solo pinta bodega, cliente, proveedor, tipo de envío, fecha, bultos y estatus; descarta `idBodega`, `fechaPrevio`, `tipoCaptura`, `fechaDocumento`, `esOpenpo`. |
| GET | `/api/Visualization/detalle-entrada/{idEntrada}` | `CSP_PMX_DetalleEntrada`. No valida `idEntrada` vacío. Incluye `EsOpenPO`, `MMS`, `clasificado` (bool), `descripcionClas`, `discrepancia`. No devuelve el string `clasificacion`. `cantidadCartones` y `precioUnitario` llegan al cliente y la lista no los muestra. |
| GET | `/api/Visualization/detalle-pos/{idEntrada}` | `CSP_PMX_DetallePOs`. |
| GET | `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `idUsuario` sale del claim `NameIdentifier`. Sin claim: **401**. Sin fila: **404**. `CSP_PMX_ValidarCierrePrevio` → `estatus`, `bultosTotales`, `bultosPrevio`, `msg`. El front manda `true`/`false` literal y solo lee `estatus`/`msg`. El modal se cierra antes del request. |
| POST | `/api/Visualization/registrar-partida` | Requiere `idBulto`, `idProducto`. `csp_PMX_RegistrarPartida`. Campo `mms`. |
| PUT | `/api/Visualization/actualizar-partida` | Requiere `id > 0`, `idBulto`, `idProducto`. `csp_PMX_ActualizarPartida`. |
| DELETE | `/api/Visualization/eliminar-partida` | **Body JSON**. El action exige `idBulto`, `referencia`, `idProducto`. No exige `id` (la UI manda `parseInt` o `0`; el SP igual recibe `@id`). No query string. `csp_PMX_EliminarPartida`. |
| POST | `/api/Visualization/agregar-openpo` | Requiere `referencia`, `po`, `packing` (mensaje de error: “Paking”). `csp_PMX_AgregarOpenPO`. |
| POST | `/api/Visualization/validar-cuarentenas` | Body `{ idEntrada, idUsuario }`. Solo rechaza `idUsuario` vacío (**400**); `idEntrada` vacío igual llama al SP. **Sin cliente frontend.** |
| POST | `/api/Visualization/validar-marca` | `csp_PMX_ValidaMarca` → `{ valido }`. Sin fila: **404** `"No se pudo validar la marca"`. El form trata ese error como campo válido. |
| POST | `/api/Visualization/validar-modelo` | `csp_PMX_ValidaModelo` → `{ valido }`. Sin fila: **404** `"No se pudo validar el modelo"`. Mismo criterio en la UI. |
| GET | `/api/Visualization/existe-previo-cerrado/{referencia}` | `csp_PMX_ExistePrevioCerrado` → `{ estatus, msg }`. |
| GET | `/api/Visualization/proveedor-previo/{referencia}` | `csp_PMX_GetProveedorPrevio`. Override de proveedor en captura si `idProveedor` no vacío. |
| POST | `/api/Visualization/puede-reabrir-previo` | Body `LoginRequest`. **400** si falta `usuario` o `password` (el SP no se llama). Si hay fila de `sp_previo_TL` (`@REIMPRESION=0`): `puedeRegenerar=true`, `lUsuario=""`. Sin fila: **500** “No se obtuvo respuesta del procedimiento” (no hay 200 con `puedeRegenerar: false`). |
| GET | `/api/Visualization/reabre-previo/{referencia}` | `csp_PMX_ReabrirPrevio`. **404** si no hay fila. |
| GET | `/api/Visualization/pdf-proxy?url=` | Solo HTTPS. Hosts: `grupoei.com.mx`, `*.grupoei.com.mx`, `aduax.com`, `*.aduax.com`, `*.amazonaws.com`. Cualquier path de esos hosts (no filtra extensión). `HttpClient` nuevo por request, timeout 30s, dentro de un `using` que termina al `return File(stream)`. Reenvía el `Content-Type` remoto (si falta, `application/pdf`). No reenvía el JWT al origen. **400** URL vacía o no HTTPS; **403** host denegado; **502** status remoto no exitoso o timeout. |

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

`actualizar-partida` añade `id` (int > 0). En alta multibulto la UI llama `registrar-partida` **una vez por bulto**. Si `um === "JGO"` envía `subCantidad`; si no, string vacío.

`usuario` lo arma el form como `idUsuario || usuario || "unknown"`. `comentarios` concatena `[NP Físico: …]` y las notas, no es el textarea crudo.

## Clasificación (`[Authorize]`)

Solo dos rutas, ambas POST, mismo SP `CSP_PMX_ValidarClasificacion`:

- `POST /api/Clasificacion/validar`
- `POST /api/Clasificacion/validar-post`

Body: `{ "idEntrada": "...", "idProducto": "..." }`.

Respuesta (camelCase): `clasificacion`, `descripcion`, `isSpum`/`spUm`, `isSppo`/`spPo`, `isSpmms`/`spMms`, `spCantidades`, `isRrmms`.

Si faltan `idEntrada` o `idProducto`: **400**. Si el SP no devuelve fila: **404** `{ "message": "No se encontró clasificación para los parámetros proporcionados" }`. El form trata ambos como producto nuevo (ver flujo de captura).

`spCantidades` es un string que la UI parte por comas. No existe GET `/api/Clasificacion/{idEntrada}/{idProducto}`.

## Protected (`[Authorize]`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/Protected/test` | Eco de claims JWT. |
| POST | `/api/Protected/valida-token-teamleader` | Body `{ usuario, token }`. `SP_FEA_ValidarTokenTeamleader_Result`. **200** si `correcto==true`; **401** si no (el interceptor web **no** redirige al login). |

## Leftover

`GET /WeatherForecast` (`[Authorize]`, ruta **sin** prefijo `/api`) es plantilla. No usarlo como guía de negocio.

## Errores

- **401** token faltante / inválido / expirado (`ClockSkew = 0`). Cuerpo JSON: `statusCode`, `message`, `error`; en fallo de firma/formato también `details` (nombre del tipo de excepción).
- **403** en `pdf-proxy` = host no permitido, no “sin rol”. El interceptor Axios lo trataría como logout; el visor PDF.js **no** usa Axios.
- **500** de los controllers de negocio: `{ "message": "...", "error": "<Exception.Message>" }`. `error` puede incluir texto de SQL. No reenviarlo a tickets con datos de cliente.
