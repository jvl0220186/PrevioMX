# Flujo de captura

Verificado en `DashboardView.jsx`, `DashboardTable.jsx`, `CaptureView.jsx`, `AddPartidasForm.jsx`, `PdfOcrViewer.jsx` y `VisualizationController`.

## Dashboard → captura

1. `DashboardView` lee `user.equipo` de `localStorage` y llama `GET /api/Visualization/pendientes/{equipo}`.
2. KPI locales (no son endpoints): `Sin Documentos`, `Procesando Documentos`, `Documento Listo`, `TOTAL`.
3. **Capturar** en `DashboardTable`:
   - Si `estatus` es `Sin Documentos` (case-insensitive), pide confirmación.
   - Guarda `captureData` en `localStorage` (reference, cliente, proveedor, documentos, …).
   - Navega a `/capture/:reference`.
4. `CaptureView` recarga `captureData` y pide `GET /detalle-entrada/{id}` + catálogos `1` (UM) y `2` (países).

## Reabrir previo cerrado

Cuando la búsqueda no deja filas, el dashboard (debounce 400 ms) llama `GET /existe-previo-cerrado/{term}`. Si `estatus === true`, muestra **Reabrir previo**.

1. Modal con `usuario` / `password`.
2. `POST /puede-reabrir-previo` → `sp_previo_TL`. Si hay fila, la API pone `puedeRegenerar: true` siempre.
3. La UI solo continúa si `puedeRegenerar === true`.
4. `GET /reabre-previo/{referencia}` → arma `captureData` y entra a captura.

## Partidas

`AddPartidasForm` crea/edita/borra vía:

- `POST /api/Visualization/registrar-partida`
- `PUT /api/Visualization/actualizar-partida`
- `DELETE /api/Visualization/eliminar-partida` (body JSON, no query)

Campos típicos: bulto, producto, UM, cantidad, subcantidad, país, OC, no. parte físico, comentarios, `mms`.

Al cambiar producto: `POST /api/Clasificacion/validar-post` (no el GET muerto de `getClasificacion`).

Flags Standard Pack:

| Flag | UI |
|------|----|
| `isSpum` / `spUm` | UM sugerida |
| `isSppo` / `spPo` | PO sugerido |
| `isSpmms` | Badges/alertas MMS |
| `isRrmms` | MMS **obligatorio**: `# series === cantidad` |
| `spMms` / `spCantidades` | Texto auxiliar del SP |

## MMS (marca / modelo / serie)

- Los inputs de marca, modelo y serie **siempre** se renderizan.
- Badges y alertas se encienden si `isSpmms || isRrmms`.
- Obligatorio **solo** con `isRrmms`: no se habilita guardar si `mmsEntries.length !== quantity`.
- Con `isSpmms` y sin `isRrmms`, MMS es opcional (alerta informativa).
- Payload: `marca|modelo|serie` por pieza, grupos unidos con `~`:

```
ACME|X1|SN001~ACME|X1|SN002
```

(`buildMmsString` en `AddPartidasForm.jsx`.)

Al editar, si `partida.mms` tiene valor, se parsea por `~` / `|` y se fuerza `isSpmms: true`.

Marca/modelo se pueden validar con `POST /validar-marca` y `/validar-modelo` (`{ valido }`).

## OpenPO

Si la entrada es OpenPO, se listan POs con `GET /detalle-pos/{idEntrada}`.

Agregar PO: `POST /agregar-openpo` `{ referencia, po, packing }`.

- UI: solo exige `po`; `packing` puede ir `""`.
- API: 400 `"Paking es requerido"` si `packing` es whitespace.

## Cierre

`CaptureView.handleFinalize(discrepancia, aplicaNom144)` →

`GET /validar-cierre-previo/{idEntrada}/{true|false}/{true|false}`

El API toma `idUsuario` del JWT (`NameIdentifier`). Si `estatus` es true, toast y vuelta al dashboard.

`POST /validar-cuarentenas` existe en API y **no** se llama desde el frontend.

## PDF / OCR

Documentos del pendiente (`ruta_documento` partido por `|`) se abren en `PdfOcrViewer`.

- Mismo origen: fetch directo.
- Cross-origin: `{API}/api/Visualization/pdf-proxy?url=` + Bearer.
- Worker: en dev, módulo de `pdfjs-dist`; en prod, `/PrevioMX/pdf.worker.min.mjs`.
- Selección de región + Tesseract para rellenar campos (p. ej. número de parte).

Allowlist del proxy: `grupoei.com.mx`, `aduax.com`, `*.amazonaws.com` (solo HTTPS). Un 403 de host se interpreta como logout.

## Estado local

| Clave | Quién la escribe | Quién la borra |
|-------|------------------|----------------|
| `token`, `user` | login | logout / 401 / 403 / token expirado |
| `captureData` | tabla / reapertura | interceptor al redirigir al login |

Sin `captureData`, la captura se degrada (detalle por `reference` de la URL, sin metadatos del pendiente).
