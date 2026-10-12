# Flujo de captura

Codepaths: `DashboardView.jsx`, `DashboardTable.jsx`, `CaptureView.jsx`, `AddPartidasForm.jsx`, `ProveedoresCombo.jsx`, `PdfOcrViewer.jsx`, `previo.service.js`.

## Dashboard → captura

1. Al montar, lee `localStorage.user.equipo` (no `AuthContext`) y llama `getPendientes(equipo)` (`GET /api/Visualization/pendientes/{equipo}`). Sin `user` (p. ej. `VITE_DEV_MODE`) el equipo es `''`.
2. KPIs por `estatus` **exacto**: `Sin Documentos`, `Procesando Documentos`, `Documento Listo`. Click en un KPI filtra la tabla.
3. El chip del Header “Pendientes” es `total - Documento Listo` (incluye “Procesando…”).
4. Filtro extra: multi-select de cliente (**todos seleccionados** al cargar) y búsqueda (referencia, cliente, proveedor, fecha, bultos, estatus). Desmarcar **todos** deja `selectedClients` vacío; `applyFilters` solo filtra si `clients.length > 0`, así que la tabla vuelve a mostrar todos los clientes.
5. Columnas visibles extra: **Bodega** y **Tipo Envío**. La búsqueda no las incluye (tampoco `idCliente`). Celdas de texto de más de 50 caracteres se cortan; el valor completo queda en el atributo `title`.
6. El orden de columnas es en el cliente (`a[key] < b[key]`, sensible a mayúsculas). `bundles` es número. `date` ya viene de `toLocaleDateString('es-ES')`, así que el orden es lexicográfico, no por calendario.
7. Columna IA: el map fuerza `ai: false`; siempre muestra “—”.
8. “Iniciar Captura” guarda `captureData` y navega a `/capture/:reference`. Si `status` es “Sin Documentos” (case-insensitive) primero pide confirmación (“Mercancía Sin Documentos”).

`CSP_PMX_ObtenerPendientes` también devuelve `idBodega`, `fechaPrevio`, `tipoCaptura`, `fechaDocumento` y `esOpenpo`. El map del dashboard no los usa. El flag OpenPO de la captura sale del **primer** ítem de `detalle-entrada` (`EsOpenPO`), no de `esOpenpo` de la lista.

Si `equipo` va vacío (`VITE_DEV_MODE`), la URL queda `/api/Visualization/pendientes/` y **no** coincide con `pendientes/{equipo}` (404). El 400 `"Equipo es requerido"` solo corre cuando el segmento llega y es blanco. La vista ignora el body y muestra siempre `"Error al cargar los datos."`.

`captureData` (localStorage):

```json
{
  "reference": "…",
  "idCliente": "",
  "client": "",
  "idProveedor": "",
  "provider": "",
  "date": "",
  "bundles": 0,
  "status": "",
  "documentos": [{ "documento": "archivo.pdf", "rutaDocumento": "https://…" }]
}
```

`CaptureView` solo reutiliza `captureData` si `data.reference === :reference`. Si no coincide, ignora storage. Hay fallback legacy `rutaDocumento` → un solo documento.

`GET detalle-entrada` responde `{ items }` y nada más. El código lee `detalle.fechaEntrada`, `detalle.idCliente`, `detalle.cliente`, `detalle.idProveedor` y `detalle.proveedor`, pero esas propiedades no existen en el DTO: un deep link o un `captureData` de otra referencia deja cliente y fecha en blanco **después** del 200. La lista de PDF se arma una sola vez desde `captureData` (`documentos` o el fallback) y no se vuelve a pedir. Sin storage coincidente no hay visor, aunque la entrada tenga `ruta_documento` en pendientes.

### Reabrir previo

Se muestra solo si hay término de búsqueda, la tabla filtrada queda vacía **y** `GET existe-previo-cerrado/{término}` responde `estatus: true` (debounce 400 ms). Un filtro de KPI/cliente que vacíe la tabla **sin** término no dispara el check.

1. Modal: “credenciales especiales” (no el JWT de sesión). El botón Validar solo exige `usuario` no vacío. La contraseña **no** es obligatoria en la UI.
2. El modal se cierra **antes** del request. Un fallo solo deja toast.
3. `POST /api/Visualization/puede-reabrir-previo`. Si `password` va vacío o en blanco, la API responde **400** `{ "message": "Contraseña es requerida" }` y no ejecuta `sp_previo_TL`.
4. Si `puedeRegenerar === true` → `GET /api/Visualization/reabre-previo/{referencia}`.
5. El ítem reabierto se guarda en `captureData` y se navega a `/capture/${searchTerm}` (**el término de búsqueda**, no `item.idEntrada`). La fecha se formatea con `toLocaleDateString('es-ES')`, igual que el dashboard.

Si `sp_previo_TL` devuelve fila, `puedeRegenerar` se hardcodea a `true`. Si no hay fila, `PuedeReabrirPrevio` retorna `null` y el controller responde **500** `{ "message": "No se obtuvo respuesta del procedimiento" }`. El toast “No se puede reabrir el previo con las credenciales proporcionadas” solo corre en un 200 con `puedeRegenerar !== true`; con el mapeo actual ese 200 no ocurre.

## Carga de captura

- Catálogos: `GET /api/Catalogos/1` (UM) y `/api/Catalogos/2` (países). Labels: `` `[${cValue}] ${cText}` ``. El dropdown guarda y envía `cValue` (`um` / `paisOrigen`), no el texto visible. OpenPO precarga `product.um` / `product.paisOrigen` tal cual vienen de `detalle-pos`.
- Detalle: `GET /api/Visualization/detalle-entrada/{id}`.
- Si el **primer** ítem tiene `esOpenPO === true` → `GET /api/Visualization/detalle-pos/{id}`.
- Proveedor: `GET /api/Visualization/proveedor-previo/{referencia}` pisa id y nombre si `idProveedor` no vacío. Si ese GET falla, se queda el valor de `captureData` (el detalle no trae proveedor). El modal “Cambiar proveedor” solo escribe estado React: `idProveedor = cValue`, `provider = cText` crudo (sin el prefijo `[cValue]` de UM/país). Aceptar sin haber elegido cierra el modal y no cambia nada. No hay endpoint de “guardar proveedor”: el id nuevo viaja en el siguiente `registrar-partida` / `actualizar-partida`. Recargar la captura vuelve a llamar `proveedor-previo` y pisa la selección. El combo abre filtrando por el id actual (`initialFilter`) y pagina desde `0`.

KPIs locales (sobre `detalle.items`):

| KPI | Fórmula |
|---|---|
| Total bultos | `distinct idBulto` |
| Capturados | `distinct idBulto` con `idProducto` no vacío |
| Pendientes | total − capturados |
| Líneas | items con `idProducto` no vacío |

La lista agrupa por `idBulto` (sin id → grupo `Sin Bulto`). En cada fila:

| Señal | Origen | Efecto |
|---|---|---|
| Icono check / reloj | bool `clasificado` | Solo visual. El form no lo usa. |
| Badge de advertencia | bool `discrepancia` de la línea | Solo visual. El checkbox del cierre arranca en `false` y no copia este valor. |
| Badge `MMS` | string `mms` no vacío | El bool `series` del DTO no se lee. |
| Descripción | `descripcionClas` | Se corta a 40 caracteres. |
| Comentarios | `comentarios` | Se cortan a 20; el texto completo queda en `title`. |

Cero partidas con `idProducto` muestra el texto “Este documento no fue procesado con IA”. No hay flag de IA: el dashboard fuerza `ai: false` y este empty state es solo “lista vacía”.

## Partidas (Standard Pack / MMS)

Al salir del número de parte: `POST /api/Clasificacion/validar-post` `{ idEntrada, idProducto }`.

Producto **clasificado** solo si `clasificacion` cumple `/^\d{10}$/` (10 dígitos). Si no, o si la respuesta no trae clasificación, descripción ni flags SP: toast de producto nuevo y la descripción queda opcional. Un 404 u otro error en el flujo normal hace lo mismo y limpia el Standard Pack. En OpenPO ese error no muestra el toast: conserva UM y país del PO. Si se guarda sin descripción, `comentarios` empieza con el literal `REVISION` (además de `[NP Físico: …]` y las notas, unidos por espacio).

`spCantidades` se parte por comas. Al salir de cantidad, si hay sugerencias y el número (`parseFloat`) no coincide con ninguna, el form pide token de Team Leader. Cancelar el modal revierte a la **primera** cantidad sugerida.

| Flag | Efecto en UI |
|---|---|
| `isSpum` + `spUm` | Prefill / alerta si la UM difiere. Cambiar UM pide token de Team Leader. |
| `isSppo` + `spPo` | Igual para país de origen. |
| `spCantidades` | Cantidad fuera de la lista (coma-separada) pide token de TL. |
| `isSpmms` | Badges/alertas MMS (opcional). |
| `isRrmms` | MMS **obligatorio**: número de series === cantidad. |

## Editar una partida

Click en la fila abre el form. El botón de borrar hace `stopPropagation`. El icono de la fila usa el bool `clasificado` de `detalle-entrada` (check / reloj). Ese DTO no trae el string `clasificacion`.

Al abrir, `isProductoClasificado` queda en false hasta blur o Enter del número de parte (`validar-post`). Hasta entonces la descripción es opcional, no se validan marca/modelo, y los flags de Standard Pack están vacíos. Si el MMS guardado tiene series, el form fuerza `isSpmms` antes de revalidar. Grupos MMS sin serie se descartan al parsear (`marca|modelo|serie`).

Al revalidar en edición, UM y país no se pisan con el Standard Pack. Los valores actuales de UM, país y cantidad se marcan como ya autorizados. El bulto queda bloqueado; no hay multibulto en edición.

El parser de notas solo extrae `[NP Físico: …]`. Un `REVISION` previo se queda en el textarea. Si la descripción sigue vacía, `buildComentarios()` antepone otro `REVISION`.

Bajo la cantidad, `numeroALetras` muestra el entero en español (`parseInt`; los decimales se truncan). Es ayuda visual: el payload manda `String(quantity)`. Número de parte, descripción, NP físico y serie se fuerzan a mayúsculas al teclear.

Al pie de la lista, un total por UM suma `parseFloat` de `cantidad` (cada coma pasa a punto). UM vacía se agrupa como `Sin UM`.

Los inputs Marca / Modelo / Serie se renderizan siempre. La obligatoriedad la define solo `isRrmms`.

La serie se fuerza a mayúsculas. No se puede agregar serie si marca/modelo están en invalidación. Duplicados de serie se rechazan case-insensitive. Tope: no más series que la cantidad.

Payload MMS:

```
marca|modelo|serie~marca2|modelo2|serie2
```

Marca y modelo se validan al blur contra `POST /api/Visualization/validar-marca` y `validar-modelo` cuando el producto está clasificado. `valido: false` deja el campo en rojo y no permite agregar la serie. Un 404 (`"No se pudo validar la marca"` / `"No se pudo validar el modelo"`), un 500 o un fallo de red entran al `catch` y el form **deja el campo como válido**. Los DTO no tienen `[Required]`: un body con strings vacíos igual llama al SP.

CRUD:

- Alta: `POST /api/Visualization/registrar-partida` — **un request por bulto** si el form está en multibulto (`selectedBultos`). Un fallo parcial no deshace los éxitos.
- Edición: `PUT /api/Visualization/actualizar-partida` (`id > 0`)
- Baja: `DELETE /api/Visualization/eliminar-partida` con **body JSON** (`id`, `idBulto`, `referencia`, `idProducto`). El controller no valida `id`; la UI manda `parseInt(id) || 0`. Un 200 con `estatus: false` deja la fila.

`usuario` en el payload de partida: `localStorage.user.idUsuario || usuario || "unknown"` (distinto del token de TL, que usa solo `usuario`). Si `um === "JGO"` el form exige `subCantidad` y la envía; si no, `""`. `DetalleEntradaDto` no tiene `sub_cantidad`: al editar el campo arranca vacío y, con UM `JGO`, el botón sigue deshabilitado hasta volver a capturarla. El SP de actualizar sí recibe `@sub_cantidad`. En OpenPO, `ocCompra` cae a `selectedPO` si el campo está vacío. `comentarios` lo arma `buildComentarios()` (puede incluir `REVISION`).

## Token de Team Leader

Si el capturista desvía UM, país o cantidad del Standard Pack (o elige OpenPO en un conflicto), `AddPartidasForm` pide un token y llama `POST /api/Protected/valida-token-teamleader`.

`usuario` de ese POST es `localStorage.user.usuario` (o `"unknown"`). No usa `idUsuario`. El campo `usuario` de registrar/actualizar partida sí es `idUsuario || usuario || "unknown"`.

- **200** solo si el SP devuelve fila y `Correcto == true`. El body incluye `usuarioAprobo`; el toast lo muestra entre paréntesis.
- **401** si hay fila y `Correcto` no es true: `{ correcto, mensaje }` (sin `usuarioAprobo`). Cae al `catch`. Este 401 **no** cierra la sesión.
- **404** `{ "message": "No se pudo validar el token" }` si el SP no devuelve fila. También cae al `catch` (`message`, no `mensaje`).
- El DTO no tiene `[Required]`. Un body `{}` igual llama al SP con strings vacíos.
- `user.lider` y el claim `Lider` no intervienen. El flag de login no autoriza el desvío.

## OpenPO

- Selectores de PO / producto desde `detalle-pos`. Productos ya usados se marcan con sufijo ` ✓`.
- Si el PO tiene un solo producto y tanto `idProducto` como `descripcion` son `REVISION` (trim, mayúsculas), no se muestra el selector: pasa a captura manual de número de parte.
- Alta de PO extra: `POST /api/Visualization/agregar-openpo`. El modal tiene `po` y `packing`; el cliente solo bloquea si falta `po`. Sin `packing` la API responde 400 (“Paking es requerido”).
- Conflicto OpenPO vs Standard Pack: modal para elegir origen. Elegir OpenPO cuando difiere del SP requiere token de TL.
- Si no quedan POs, se habilita captura manual.

## Cierre

1. Checkbox “He verificado los desgloses…” habilita el botón.
2. Modal: `discrepancia` y `aplicaNom144` (ambos default `false`).
3. El modal se cierra **antes** del GET. Un fallo solo deja toast.
4. `GET /api/Visualization/validar-cierre-previo/{id}/{discrepancia}/{aplicaNom144}` (`true`/`false` literal).
5. El `idUsuario` lo toma la API del JWT (`NameIdentifier`), no del body. Sin ese claim: **401** `"No se pudo obtener el ID del usuario del token JWT"`. Sin fila del SP: **404** `"No se encontró información de validación para la entrada especificada"`.
6. La UI usa `estatus` y `msg`. Ignora `bultosTotales` y `bultosPrevio`. `estatus: true` → toast y `navigate('/dashboard')` inmediato. `false` → toast con `msg`, permanece en captura.

`validar-cuarentenas` no se llama desde la UI.

## PDF / OCR

`PdfOcrViewer` (pdfjs-dist + tesseract.js):

- Zoom 0.5–3 (paso 0.25), rotación, selección de región para OCR.
- Tesseract usa el idioma `spa`. Una selección menor de 5×5 px se ignora.
- Puede rellenar número de parte desde el PDF (`ocrTarget === 'partNumber'`). El texto se recorta, se pasa a mayúsculas, se limpia el Standard Pack y se habilita captura manual de OpenPO. No llama `validar-post` hasta blur o Enter. Si Tesseract falla, el callback recibe `''` y el número de parte no cambia.
- Same-origin: carga directa. Cross-origin: `pdf-proxy` + header JWT via pdf.js (no Axios). 403 de pdf.js **no** pasa por el interceptor.
- Hosts del proxy: HTTPS de grupoei / aduax / `*.amazonaws.com`.

En producción el worker debe existir en `{base}pdf.worker.min.mjs` (lo copia el plugin de Vite al `dist/`). En IIS hace falta el MIME `.mjs` de `public/web.config`.
