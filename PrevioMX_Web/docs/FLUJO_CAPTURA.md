# Flujo de captura de previo

Guía funcional verificada contra `DashboardView.jsx`, `CaptureView.jsx`, `AddPartidasForm.jsx`, `PdfOcrViewer.jsx`, `ProveedoresCombo.jsx` y `previo.service.js`.

## Rutas involucradas

| Ruta | Componente | Propósito |
| --- | --- | --- |
| `/` | `LoginView` | Autenticación con `POST /api/Auth/login`. |
| `/dashboard` | `DashboardView` | Pendientes por equipo, filtros y reapertura. |
| `/capture/:reference` | `CaptureView` | PDF/documentos, detalle, KPIs y partidas. |

El router usa `basename="/PrevioMX"`. Las rutas operativas usan `ProtectedRoute`; sin token válido se redirige al login.

## Secuencia desde dashboard

1. Lee `localStorage.user` y toma `user.equipo`.
2. Llama `previoService.getPendientes(equipo)`.
3. Al seleccionar una referencia, guarda `localStorage.captureData` y navega a `/capture/:reference`.
   - Si el estatus es `"Sin Documentos"`, `DashboardTable` pide confirmación antes de continuar.
4. Si una búsqueda no tiene resultados, consulta `existe-previo-cerrado`.
5. Si el previo está cerrado:
   - `puedeReabrirPrevio({ usuario, password })`
   - `reabrePrevio(referencia)`
   - guarda el pendiente reabierto como `captureData`
   - navega a captura.

## Carga inicial de captura

Al montar `CaptureView`:

1. Lee `captureData` y valida que `data.reference` coincida con la ruta.
2. Carga en paralelo:
   - `GET /api/Visualization/detalle-entrada/{reference}`
   - `GET /api/Catalogos/1` (unidades)
   - `GET /api/Catalogos/2` (países)
3. Consulta `GET /api/Visualization/proveedor-previo/{reference}`.
4. Calcula KPIs (bultos totales/capturados/pendientes y líneas de producto).
5. Si `detalleItems[0].esOpenPO === true`, llama `GET /api/Visualization/detalle-pos/{reference}`.

Los catálogos `1` y `2` están hardcodeados en `CaptureView`.

## Producto y Standard Pack

En captura normal, al perder foco o presionar Enter en el número de parte se ejecuta:

```text
POST /api/Clasificacion/validar-post
{ "idEntrada": "...", "idProducto": "..." }
```

En OpenPO, primero se elige PO/producto desde `openPOData` y luego se valida con el mismo endpoint.

La respuesta puede traer:

- Clasificación / descripción
- Unidad (`isSpum`, `spUm`)
- País (`isSppo`, `spPo`)
- MMS (`isSpmms`, `spMms`, `spCantidades`, `isRrmms`)

Si la clasificación no es un número de 10 dígitos, el producto se trata como nuevo y se avisa que requiere fotografías.

### Diferencias contra Standard Pack

Si el usuario elige unidad, país o cantidad distinta a la esperada, o decide usar valores OpenPO sobre Standard Pack, se abre el modal de token Team Leader:

```text
POST /api/Protected/valida-token-teamleader
{
  "usuario": "<usuario logueado>",
  "token": "<token capturado>"
}
```

El interceptor de Axios **no** redirige al login si esta validación responde 401/403.

## MMS (Marca / Modelo / Serie)

Reglas implementadas en `AddPartidasForm`:

| Bandera | Efecto en UI |
| --- | --- |
| `isSpmms = true` | Activa badge/alerta MMS. Si `isRrmms` es false, MMS es **opcional** y no bloquea el guardado. |
| `isRrmms = true` | MMS es **obligatorio**: número de series capturadas = cantidad. |

Los campos Marca/Modelo/Serie están siempre en el formulario; las banderas controlan badges, alertas y validación.

Comportamiento adicional:

- Series duplicadas (mismo texto de serie, case-insensitive) se rechazan.
- No se permiten más series que la cantidad.
- Marca y modelo se validan con:
  - `POST /api/Visualization/validar-marca`
  - `POST /api/Visualization/validar-modelo`
- Al editar una partida, el string `mms` se parsea con `~` entre grupos y `|` entre marca/modelo/serie; si hay `mms`, el form fuerza `isSpmms: true`.
- El request final envía:

```text
marca1|modelo1|serie1~marca2|modelo2|serie2
```

Si no hay entradas MMS, se envía `mms: ""`.

## Guardado de partidas

Creación:

- Construye `RegistrarPartidaRequest`.
- En multibulto, llama `registrarPartida` una vez por bulto.
- Usuario desde `localStorage.user.idUsuario` o `localStorage.user.usuario`.

Edición:

- `PUT /api/Visualization/actualizar-partida` con `id` de la partida.

Eliminación:

- `CaptureView` confirma y llama `DELETE /api/Visualization/eliminar-partida` con body:

```json
{
  "id": 10,
  "idBulto": "B1",
  "referencia": "REF123",
  "idProducto": "SKU-001"
}
```

## OpenPO

Si el previo es OpenPO:

1. `CaptureView` carga `detalle-pos` cuando `detalleItems[0].esOpenPO === true`.
2. `AddPartidasForm` permite seleccionar PO y producto.
3. Conflictos OpenPO vs Standard Pack (UM/país) se resuelven en modal; elegir OpenPO puede exigir token Team Leader.
4. Agregar PO:

```text
POST /api/Visualization/agregar-openpo
{
  "referencia": "<idEntrada>",
  "po": "<orden de compra>",
  "packing": "<packing>"
}
```

Restricciones:

- El modal pide PO y packing; el submit del frontend solo exige PO (`packing` puede ir `""`).
- El API exige también `packing` no vacío (mensaje: `"Paking es requerido"`).
- Si el único producto del PO es `REVISION / REVISION`, la UI entra a captura manual.

Cuando ya no hay POs disponibles, la UI permite continuar con captura manual.

## Cierre de previo

Tras marcar la verificación de desgloses:

```text
GET /api/Visualization/validar-cierre-previo/{reference}/{discrepancia}/{aplicaNom144}
```

El API toma `idUsuario` del JWT. Si `response.estatus` es verdadero, vuelve a `/dashboard`; si no, muestra `response.msg`.

## PDF y OCR

`PdfOcrViewer`:

- Desarrollo: worker desde `node_modules`.
- Producción: `{BASE_URL}pdf.worker.min.mjs` (copiado en build).
- Cross-origin: `GET /api/Visualization/pdf-proxy?url=...` con JWT.
- Hosts permitidos: `grupoei.com.mx`, `aduax.com`, `.amazonaws.com` y subdominios.
- OCR: Tesseract en navegador (`spa`) sobre región seleccionada; puede rellenar número de parte.

Un `403` del proxy (host no permitido) **no** está exceptuado en `api.service.js`; el interceptor limpia sesión y redirige al login.

## Paginación de proveedores

`ProveedoresCombo`:

- Debounce 350 ms.
- `pageSize` default 20.
- Primera página enviada: `pageNumber = 0`.
- `handleLoadMore` pide `page + 1` si `result.more` es true.

`CatalogosService` calcula `More = page < totalPages` asumiendo página 1-based. Con `pageNumber = 0` y una sola página, `More` queda `true` y el combo pedirá la página `1`.

## Pitfalls frecuentes

- `VITE_API_BASE_URL` debe ser la raíz de la API (`https://localhost:5001`), no una ruta que termine en `/api`.
- En producción, `.env.production` usa `https://preproduccion.grupoei.com.mx/PrevioMXApi`; el fallback de código es `http://192.168.6.185/PrevioMX/Api` solo si no hay env.
- Axios usa URL absoluta (`API_CONFIG.BASE_URL`); el proxy `/api` de Vite no se usa salvo que apuntes al origen de Vite. Además, `vite.config.js` lee `process.env.VITE_API_BASE_URL` sin `loadEnv`, así que el proxy ignora `.env*` salvo que la variable exista en el shell.
- `VITE_DEV_MODE=true` crea un usuario mock sin JWT real; dashboard/captura seguirán fallando contra la API.
- `VITE_AB3_URL` está en `.env*` pero no se consume en `src/`.
- Si el PDF falla en IIS, revisar MIME `.mjs` y rewrite SPA en `public/web.config`.
- Si la sesión expira, `api.service.js` elimina `token`, `user` y `captureData`. El logout del `Header` hace `localStorage.clear()`.
- `getClasificacion()` en `previo.service.js` apunta a un GET inexistente; el flujo activo usa `validarPost()`.
- `POST /api/Visualization/validar-cuarentenas` existe en la API pero no tiene wrapper en `previo.service.js`.
- MMS opcional (`isSpmms` sin `isRrmms`) no debe bloquear el guardado si no hay series.
- Al agregar OpenPO, packing vacío pasa la validación del frontend y falla en el API.
- CORS local no incluye orígenes de preprod/prod; el SPA en otro dominio fallará el preflight.
