# Flujo de captura

Codepaths: `DashboardView.jsx`, `CaptureView.jsx`, `AddPartidasForm.jsx`, `ProveedoresCombo.jsx`, `PdfOcrViewer.jsx`, `previo.service.js`.

## Dashboard → captura

1. Al montar, `getPendientes(user.equipo)` (`GET /api/Visualization/pendientes/{equipo}`).
2. KPIs por `estatus` exacto: `Sin Documentos`, `Procesando Documentos`, `Documento Listo`.
3. Click en una fila guarda `captureData` en `localStorage` y navega a `/capture/:reference`.
4. `CaptureView` solo reutiliza `captureData` si `data.reference === :reference`.

### Reabrir previo

Se muestra solo si la búsqueda no deja filas **y** `GET existe-previo-cerrado/{término}` responde `estatus: true`.

1. Modal: usuario + contraseña (no el JWT de sesión).
2. `POST /api/Visualization/puede-reabrir-previo`.
3. Si `puedeRegenerar === true` → `GET /api/Visualization/reabre-previo/{referencia}`.
4. El ítem reabierto se guarda en `captureData` y se abre captura.

En API, si `sp_previo_TL` devuelve fila, `puedeRegenerar` se hardcodea a `true`.

## Carga de captura

- Catálogos: `GET /api/Catalogos/1` (UM) y `/api/Catalogos/2` (países).
- Detalle: `GET /api/Visualization/detalle-entrada/{id}`.
- Si el primer ítem tiene `esOpenPO === true` → `GET /api/Visualization/detalle-pos/{id}`.
- Proveedor: si hace falta, `GET /api/Visualization/proveedor-previo/{referencia}`. El combo de cambio usa `POST /api/Catalogos/catalogo-proveedores` (página desde 0, debounce 350 ms, pageSize 20).

KPIs locales: bultos únicos, bultos con producto, pendientes, líneas.

## Partidas (Standard Pack / MMS)

Al salir del número de parte: `POST /api/Clasificacion/validar-post` `{ idEntrada, idProducto }`.

| Flag | Efecto en UI |
|---|---|
| `isSpum` + `spUm` | Prefill / alerta si la UM difiere. Cambiar UM pide token de Team Leader. |
| `isSppo` + `spPo` | Igual para país de origen. |
| `isSpmms` | Badges/alertas MMS. |
| `isRrmms` | MMS **obligatorio**: número de series === cantidad. |

Los inputs Marca / Modelo / Serie se renderizan siempre. La obligatoriedad la define solo `isRrmms`.

Payload MMS:

```
marca|modelo|serie~marca2|modelo2|serie2
```

La UI rechaza series duplicadas (case-insensitive). Marca y modelo se validan contra `POST /api/Visualization/validar-marca` y `validar-modelo` cuando aplica.

CRUD:

- Alta: `POST /api/Visualization/registrar-partida`
- Edición: `PUT /api/Visualization/actualizar-partida` (`id > 0`)
- Baja: `DELETE /api/Visualization/eliminar-partida` con **body JSON** (`id`, `idBulto`, `referencia`, `idProducto`)

`usuario` en el payload es el usuario de sesión.

## Token de Team Leader

Si el capturista desvía UM/país del Standard Pack (o elige OpenPO en un conflicto), `AddPartidasForm` pide un token y llama `POST /api/Protected/valida-token-teamleader` `{ usuario, token }`.

- 200 + `correcto: true` → aplica el valor.
- 401 de este endpoint **no** cierra la sesión (excepción en `api.service.js`).

## OpenPO

- Selectores de PO / producto desde `detalle-pos`.
- Alta de PO extra: `POST /api/Visualization/agregar-openpo`. La API exige `referencia`, `po` y `packing`. El form solo exige `po` en cliente; sin `packing` la API responde 400 (“Paking es requerido”).
- Conflicto OpenPO vs Standard Pack: modal para elegir origen. Elegir OpenPO cuando difiere del SP requiere token de TL.
- Productos ya capturados se marcan en sesión. Si no quedan POs, se habilita captura manual.

## Cierre

1. Checkbox “He verificado los desgloses…” habilita el botón.
2. Modal: `discrepancia` y `aplicaNom144`.
3. `GET /api/Visualization/validar-cierre-previo/{id}/{discrepancia}/{aplicaNom144}`.
4. El `idUsuario` lo toma la API del JWT (`NameIdentifier`), no del body.
5. `estatus: true` → toast y vuelta al dashboard. `false` → toast con `msg`, permanece en captura.

`validar-cuarentenas` no se llama desde la UI.

## PDF / OCR

`PdfOcrViewer` (pdfjs-dist + tesseract.js):

- Zoom 0.5–3, rotación, selección de región para OCR.
- Puede rellenar número de parte desde el PDF.
- URL remota se pide por `pdf-proxy` (HTTPS + allowlist). 403 de host → el interceptor redirige al login.

En producción el worker debe existir en `{base}pdf.worker.min.mjs` (lo copia el plugin de Vite al `dist/`).
