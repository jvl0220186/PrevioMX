# Flujo de captura

Codepaths: `DashboardView.jsx`, `DashboardTable.jsx`, `CaptureView.jsx`, `AddPartidasForm.jsx`, `ProveedoresCombo.jsx`, `PdfOcrViewer.jsx`, `previo.service.js`.

## Dashboard → captura

1. Al montar, lee `localStorage.user.equipo` (no `AuthContext`) y llama `getPendientes(equipo)` (`GET /api/Visualization/pendientes/{equipo}`). Sin `user` (p. ej. `VITE_DEV_MODE`) el equipo es `''`.
2. KPIs por `estatus` **exacto**: `Sin Documentos`, `Procesando Documentos`, `Documento Listo`. Click en un KPI filtra la tabla.
3. El chip del Header “Pendientes” es `total - Documento Listo` (incluye “Procesando…”).
4. Filtro extra: multi-select de cliente (**todos seleccionados** al cargar) y búsqueda (referencia, cliente, proveedor, fecha, bultos, estatus).
5. Columna IA: el map fuerza `ai: false`; siempre muestra “—”.
6. “Iniciar Captura” guarda `captureData` y navega a `/capture/:reference`. Si `status` es “Sin Documentos” (case-insensitive) primero pide confirmación (“Mercancía Sin Documentos”).

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

`CaptureView` solo reutiliza `captureData` si `data.reference === :reference`. Si no coincide, ignora storage (header de cliente/fecha vacío hasta que responda el detalle). Hay fallback legacy `rutaDocumento` → un solo documento.

### Reabrir previo

Se muestra solo si hay término de búsqueda, la tabla filtrada queda vacía **y** `GET existe-previo-cerrado/{término}` responde `estatus: true` (debounce 400 ms). Un filtro de KPI/cliente que vacíe la tabla **sin** término no dispara el check.

1. Modal: “credenciales especiales” (no el JWT de sesión). El botón Validar solo exige `usuario`; la contraseña puede ir vacía.
2. `POST /api/Visualization/puede-reabrir-previo`.
3. Si `puedeRegenerar === true` → `GET /api/Visualization/reabre-previo/{referencia}`.
4. El ítem reabierto se guarda en `captureData` y se navega a `/capture/${searchTerm}` (**el término de búsqueda**, no `item.idEntrada`).

En API, si `sp_previo_TL` devuelve fila, `puedeRegenerar` se hardcodea a `true`.

## Carga de captura

- Catálogos: `GET /api/Catalogos/1` (UM) y `/api/Catalogos/2` (países). Labels: `` `[${cValue}] ${cText}` ``.
- Detalle: `GET /api/Visualization/detalle-entrada/{id}`.
- Si el **primer** ítem tiene `esOpenPO === true` → `GET /api/Visualization/detalle-pos/{id}`.
- Proveedor: `GET /api/Visualization/proveedor-previo/{referencia}` pisa el valor si `idProveedor` no vacío. El combo de cambio usa `POST /api/Catalogos/catalogo-proveedores` (página desde 0, debounce 350 ms, pageSize 20).

KPIs locales (sobre `detalle.items`):

| KPI | Fórmula |
|---|---|
| Total bultos | `distinct idBulto` |
| Capturados | `distinct idBulto` con `idProducto` no vacío |
| Pendientes | total − capturados |
| Líneas | items con `idProducto` no vacío |

## Partidas (Standard Pack / MMS)

Al salir del número de parte: `POST /api/Clasificacion/validar-post` `{ idEntrada, idProducto }`.

| Flag | Efecto en UI |
|---|---|
| `isSpum` + `spUm` | Prefill / alerta si la UM difiere. Cambiar UM pide token de Team Leader. |
| `isSppo` + `spPo` | Igual para país de origen. |
| `isSpmms` | Badges/alertas MMS (opcional). |
| `isRrmms` | MMS **obligatorio**: número de series === cantidad. |

Los inputs Marca / Modelo / Serie se renderizan siempre. La obligatoriedad la define solo `isRrmms`.

La serie se fuerza a mayúsculas. No se puede agregar serie si marca/modelo están en invalidación. Duplicados de serie se rechazan case-insensitive. Tope: no más series que la cantidad.

Payload MMS:

```
marca|modelo|serie~marca2|modelo2|serie2
```

Marca y modelo se validan al blur contra `POST /api/Visualization/validar-marca` y `validar-modelo` cuando el producto está clasificado.

CRUD:

- Alta: `POST /api/Visualization/registrar-partida` — **un request por bulto** si el form está en multibulto (`selectedBultos`). Un fallo parcial no deshace los éxitos.
- Edición: `PUT /api/Visualization/actualizar-partida` (`id > 0`)
- Baja: `DELETE /api/Visualization/eliminar-partida` con **body JSON** (`id`, `idBulto`, `referencia`, `idProducto`)

`usuario` en el payload: `localStorage.user.idUsuario || usuario || "unknown"`. Si `um === "JGO"` el form exige `subCantidad` y la envía; si no, `""`. En OpenPO, `ocCompra` cae a `selectedPO` si el campo está vacío. `comentarios` = `[NP Físico: …]` + notas.

## Token de Team Leader

Si el capturista desvía UM/país del Standard Pack (o elige OpenPO en un conflicto), `AddPartidasForm` pide un token y llama `POST /api/Protected/valida-token-teamleader` `{ usuario, token }`.

- 200 + `correcto: true` → aplica el valor.
- 401 de este endpoint **no** cierra la sesión (excepción en `api.service.js`).

## OpenPO

- Selectores de PO / producto desde `detalle-pos`. Productos ya usados se marcan con sufijo ` ✓`.
- Alta de PO extra: `POST /api/Visualization/agregar-openpo`. El modal tiene `po` y `packing`; el cliente solo bloquea si falta `po`. Sin `packing` la API responde 400 (“Paking es requerido”).
- Conflicto OpenPO vs Standard Pack: modal para elegir origen. Elegir OpenPO cuando difiere del SP requiere token de TL.
- Si no quedan POs, se habilita captura manual.

## Cierre

1. Checkbox “He verificado los desgloses…” habilita el botón.
2. Modal: `discrepancia` y `aplicaNom144` (ambos default `false`).
3. `GET /api/Visualization/validar-cierre-previo/{id}/{discrepancia}/{aplicaNom144}` (`true`/`false` literal).
4. El `idUsuario` lo toma la API del JWT (`NameIdentifier`), no del body.
5. `estatus: true` → toast y `navigate('/dashboard')` inmediato. `false` → toast con `msg`, permanece en captura.

`validar-cuarentenas` no se llama desde la UI.

## PDF / OCR

`PdfOcrViewer` (pdfjs-dist + tesseract.js):

- Zoom 0.5–3 (paso 0.25), rotación, selección de región para OCR.
- Puede rellenar número de parte desde el PDF (`ocrTarget === 'partNumber'`).
- Same-origin: carga directa. Cross-origin: `pdf-proxy` + header JWT via pdf.js (no Axios). 403 de pdf.js **no** pasa por el interceptor.
- Hosts del proxy: HTTPS de grupoei / aduax / `*.amazonaws.com`.

En producción el worker debe existir en `{base}pdf.worker.min.mjs` (lo copia el plugin de Vite al `dist/`). En IIS hace falta el MIME `.mjs` de `public/web.config`.
