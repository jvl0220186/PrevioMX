# Flujo de captura de previo

Guia funcional verificada contra `src/views/DashboardView.jsx`, `src/views/CaptureView.jsx`, `src/components/capture/AddPartidasForm.jsx`, `src/components/capture/PdfOcrViewer.jsx` y `src/services/previo.service.js`.

## Rutas involucradas

| Ruta | Componente | Proposito |
| --- | --- | --- |
| `/` | `LoginView` | Autenticacion con `POST /api/Auth/login`. |
| `/dashboard` | `DashboardView` | Lista pendientes por equipo, filtra referencias y permite reabrir previos cerrados. |
| `/capture/:reference` | `CaptureView` | Muestra PDF/documentos, detalle de entrada, KPIs y formulario de partidas. |

Todas las rutas operativas estan protegidas por `ProtectedRoute`; si no hay token valido, se redirige al login.

## Secuencia desde dashboard

1. `DashboardView` lee `localStorage.user`.
2. Toma `user.equipo` y llama `previoService.getPendientes(equipo)`.
3. Mapea cada pendiente a los campos que usa la tabla: `reference`, cliente, proveedor, bultos, estatus, bodega y documentos.
4. Al seleccionar una referencia, guarda los datos en `localStorage.captureData` y navega a `/capture/:reference`.
5. Si una busqueda no tiene resultados, consulta `existe-previo-cerrado`.
6. Si el previo esta cerrado, muestra la accion de reapertura:
   - `puedeReabrirPrevio({ usuario, password })`
   - `reabrePrevio(referencia)`
   - guarda el pendiente reabierto como `captureData`
   - navega a captura.

## Carga inicial de captura

Al montar `CaptureView`:

1. Lee `captureData` y valida que `data.reference` coincida con el parametro de ruta.
2. Carga en paralelo:
   - `GET /api/Visualization/detalle-entrada/{reference}`
   - `GET /api/Catalogos/1` para unidades de medida.
   - `GET /api/Catalogos/2` para paises.
3. Consulta `GET /api/Visualization/proveedor-previo/{reference}` para confirmar el proveedor actual.
4. Calcula KPIs desde el detalle:
   - `totalBultos`: bultos distintos.
   - `capturados`: bultos con `idProducto`.
   - `pendientes`: total menos capturados.
   - `lineasProductos`: partidas con producto.
5. Detecta OpenPO con `detalleItems[0].esOpenPO === true`; si aplica, llama `GET /api/Visualization/detalle-pos/{reference}`.

Los catalogos `1` y `2` estan hardcodeados en `CaptureView`; si cambian en base de datos, se debe actualizar esta pantalla.

## Registro y edicion de partidas

`AddPartidasForm` recibe de `CaptureView`:

- `idEntrada`
- `catalogUnidades`
- `catalogPaises`
- `catalogBultos`
- `idProveedor`
- `esOpenPO`
- `openPOData`
- callbacks para refrescar partidas y POs.

### Producto y Standard Pack

- En captura normal, el usuario captura `partNumber`; al perder foco o presionar Enter se ejecuta `validarPost({ idEntrada, idProducto })`.
- En OpenPO, el usuario elige PO/producto desde `openPOData`; despues se valida el producto con `validarPost`.
- La respuesta puede traer clasificacion, descripcion y datos de Standard Pack:
  - unidad (`spUm`)
  - pais (`spPo`)
  - MMS (`spMms`, `spCantidades`, `isRrmms`)
- Si la clasificacion no es un numero de 10 digitos, el producto se trata como nuevo y se avisa que requiere fotografias.

### Diferencias contra Standard Pack

Cuando el usuario selecciona una unidad, pais o cantidad distinta a la esperada, o decide usar valores OpenPO sobre Standard Pack, el formulario abre un modal de token Team Leader:

```text
POST /api/Protected/valida-token-teamleader
{
  "usuario": "<usuario logueado>",
  "token": "<token capturado>"
}
```

El interceptor de Axios no redirige al login si esta validacion devuelve 401/403; esos errores se muestran dentro del flujo.

### MMS

Si Standard Pack indica MMS:

- `isSpmms` muestra campos de marca, modelo y serie.
- `isRrmms` hace obligatorio que el numero de series coincida con la cantidad.
- Marca y modelo se validan contra:
  - `POST /api/Visualization/validar-marca`
  - `POST /api/Visualization/validar-modelo`
- El request final manda MMS como cadena `marca|modelo|serie~marca2|modelo2|serie2`.

### Guardado

Creacion:

- Construye `RegistrarPartidaRequest`.
- Si hay multibulto, llama `registrarPartida` una vez por bulto.
- Usa `usuario` desde `localStorage.user.idUsuario` o `localStorage.user.usuario`.

Edicion:

- Construye `ActualizarPartidaRequest`.
- Llama `PUT /api/Visualization/actualizar-partida`.

Eliminacion:

- `CaptureView` abre confirmacion y llama `DELETE /api/Visualization/eliminar-partida` con body JSON.

## OpenPO

Si el previo es OpenPO:

- `CaptureView` carga `detalle-pos`.
- `AddPartidasForm` permite seleccionar PO y producto.
- El boton para agregar PO llama:

```text
POST /api/Visualization/agregar-openpo
{
  "referencia": "<idEntrada>",
  "po": "<orden de compra>",
  "packing": "<packing>"
}
```

Despues de agregar, `CaptureView` recarga `detalle-pos`.

## Cierre de previo

La pantalla habilita el cierre despues de que el usuario confirma la verificacion de desgloses.

Al confirmar el modal de cierre:

```text
GET /api/Visualization/validar-cierre-previo/{reference}/{discrepancia}/{aplicaNom144}
```

El API toma `idUsuario` desde el JWT. Si `response.estatus` es verdadero, la pantalla muestra exito y vuelve a `/dashboard`; si no, muestra `response.msg`.

## PDF y OCR

`PdfOcrViewer` carga el PDF asociado al documento seleccionado:

- En desarrollo usa el worker de PDF.js desde `node_modules`.
- En produccion usa `${BASE_URL}pdf.worker.min.mjs`, copiado por `vite.config.js` durante el build.
- Si el PDF esta en otro origen, usa `GET /api/Visualization/pdf-proxy?url=...` y agrega el token JWT.
- El proxy solo acepta URLs HTTPS de hosts permitidos por `VisualizationController`.

OCR:

- Tesseract se ejecuta en navegador sobre una region seleccionada del canvas.
- El modo de seleccion puede rellenar el numero de parte desde el PDF.

## Pitfalls frecuentes

- `VITE_API_BASE_URL` debe ser la raiz de la API (`https://localhost:5001`), no una ruta que termine en `/api`.
- Si el PDF falla en IIS con el worker, revisar que `web.config` incluya MIME `.mjs` y rewrite SPA.
- Si la sesion expira, `api.service.js` elimina `token`, `user` y `captureData`.
- `getClasificacion()` en `previo.service.js` usa un endpoint GET que no existe; el flujo activo usa `validarPost()`.

