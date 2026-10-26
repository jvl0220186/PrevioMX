# Runbook operativo

Síntomas verificados contra `Program.cs`, interceptores Axios y vistas. Complementa [USO_ENDPOINTS.md](USO_ENDPOINTS.md) y [AUTENTICACION_JWT.md](AUTENTICACION_JWT.md).

## Arranque local

| Paso | Qué debe pasar | Si falla |
|---|---|---|
| `dotnet run --launch-profile https` | API en `https://localhost:5001` | Faltan DLLs `onecore.security.*` fuera del repo; o SQL no responde |
| Confiar certificado dev | El navegador acepta HTTPS local | Axios falla en silencio / `ERR_NETWORK` |
| `npm run dev` | App en `http://localhost:5173/PrevioMX/` | Entrar a `/` sin basename deja rutas rotas |
| Login | `POST /api/Auth/login` → JWT | Ver tabla de auth abajo |

CORS solo lista localhost `:5173`, `:3000`, `:5000`. Front en otro host + API local = error de navegador, no de JWT.

## Auth y sesión

| Síntoma | Causa | Qué hacer |
|---|---|---|
| Login 401 | `CSP_PMX_Login` sin fila | Probar usuario de oficina (no email). La vista activa acepta texto libre |
| Login 401 no dice “Credenciales incorrectas” | `auth.service` lanza `response.data` sin `status`; `LoginView` mira `err.status` | Esperado; sale `err.message` o el genérico |
| “Email inválido” en un form | Estás en `LoginForm.jsx` (`type="email"`), **no cableado** | Usar `LoginView.jsx` |
| Tras login, 401 en dashboard | `VITE_DEV_MODE=true` (mock sin JWT) o `VITE_API_BASE_URL` apunta a otro host | Apagar mock; alinear URL |
| Dashboard vacío / `pendientes/` sin equipo | `VITE_DEV_MODE` no escribe `localStorage.user`. La URL sin segmento no entra a `pendientes/{equipo}` (404). El 400 `"Equipo es requerido"` es otro caso (segmento en blanco). La vista siempre dice `"Error al cargar los datos."` | Login real, o sembrar `user` con `equipo` |
| Logout del Header | `localStorage.clear()` + `window.location` a `/PrevioMX/` | No pasa por `AuthContext.logout` |
| Tras JWT vencido al recargar, queda `captureData` | `authService.logout()` no borra `captureData` | El Header sí lo limpia; el interceptor Axios también |
| Sesión cae al abrir un PDF | Solo si el 403/401 fue **Axios**. El visor usa pdf.js (fetch propio) | URL HTTPS de grupoei / aduax / `*.amazonaws.com` |
| PDF same-origin no usa proxy | `origin(pdf) === origin(app)` | Esperado; no hay allowlist en ese caso |
| Sesión cae en un corte de red | `ECONNABORTED` / `ERR_NETWORK` + JWT vencido | Reloguear; timeout Axios = 30 s |
| Token “recién” emitido ya expiró | Reloj desfasado; `ClockSkew = 0` | Sincronizar hora del cliente |
| Refresh no renueva | El helper web POST-ea sin body → **400**. Con `refreshToken` no vacío el servicio igual responde **401** | Reloguear; no hay persistencia del refresh |
| Sesión cae sin pegarle a la API | Interceptor de request: JWT con `exp` vencido llama `redirectToLogin` y borra también `captureData` | Distinto del logout de arranque, que deja `captureData` |
| `register` dice email duplicado | Siempre 409 | No usar esa ruta |
| El log de la API trae el JWT completo | `OnAuthenticationFailed` y `OnChallenge` escriben el header `Authorization` entero. `OnMessageReceived` solo los primeros 50 caracteres | No copiar esa línea a un ticket |

`API_CONFIG.RETRY_ATTEMPTS` / `RETRY_DELAY` **no se usan** en Axios.

## Captura

| Síntoma | Causa | Qué hacer |
|---|---|---|
| Modal “Mercancía Sin Documentos” | Click en “Iniciar Captura” con `estatus` “Sin Documentos” (case-insensitive) | Confirmar para seguir; no es un 401 |
| Captura sin header de cliente/fecha, o sin PDF | `detalle-entrada` solo trae `items`. Cliente, fecha y documentos salen de `captureData` con la misma `reference`. El 200 del detalle no los rellena | Entrar desde el dashboard (o reabrir), no pegar `/capture/:id` a mano |
| El lápiz de proveedor no hace click | Hay al menos una línea con `idProducto`. El botón se deshabilita (`title`: no se puede cambiar cuando el detalle ya tiene partidas) | Borrar esas líneas, o aceptar el proveedor que ya viajó en ellas. El cambio sigue siendo solo estado React |
| Cambié el proveedor y al recargar volvió el anterior | El modal solo cambia estado React. No hay POST de proveedor. Al recargar, `proveedor-previo` pisa el id si viene lleno | Guardar una partida **antes** de recargar, y antes de que existan líneas, si el SP de partida debe recibir el id nuevo |
| Captura con PDF y cliente, pero sin partidas ni UM, y sin alerta | `detalle-entrada` o un catálogo falló y había `captureData` de esa referencia. El `catch` de la carga no pone `error` en ese caso | Revisar red/SP. No es un previo vacío |
| Guardé y la lista no cambió | `refreshPartidas()` traga el error. El toast de la partida puede ser de éxito igual | Reintentar al volver a abrir; mirar la consola, no el toast |
| Al editar un JGO pide subcantidad otra vez | `detalle-entrada` no devuelve `subCantidad`. El form la exige si `um === "JGO"` y el campo arranca vacío | Volver a capturarla antes de actualizar |
| “Este documento no fue procesado con IA” con partidas en cero | El empty state no mira un flag de IA. Es la lista filtrada por `idProducto` vacío. La columna IA del dashboard es siempre `ai: false` | Esperado si aún no hay líneas |
| Token TL “no encontrado” | Sin fila del SP → **404** `message`. Fila con `Correcto` distinto de true → **401** `mensaje`. Ninguno cierra sesión. El claim `Lider` no sustituye al token | Revisar usuario (`user.usuario`) y el token, no el flag `lider` |
| Catálogo UM/país vacío sin 404 | `GET /api/Catalogos/{id}` con un id que el SP no devuelve es **200** `{ items: [] }` | Confirmar que el id es `1` (UM) o `2` (países) |
| La app en blanco al abrir | `localStorage.user` no es JSON. `AuthProvider` hace `JSON.parse` sin `try` | Borrar `user` (el Header hace `localStorage.clear()`) |
| Combo de proveedores no termina de cargar | `More` con `pageNumber=0` queda `true` | Scroll extra dispara otra página vacía; no es un 401 |
| OpenPO 400 “Paking es requerido” | El modal tiene `packing` pero el cliente solo exige `po` | Llenar packing; se envía aunque sea `""` |
| MMS no deja guardar | `isRrmms` exige `#series === cantidad`; series case-insensitive únicas | Completar lista; series se fuerzan a mayúsculas |
| Marca/modelo en rojo | `validar-marca` / `validar-modelo` → `valido: false` | Corregir o no se puede agregar serie |
| Marca/modelo “pasan” con 404 | Sin fila el API responde 404; el `catch` del form deja el campo válido | No es un ok del SP. Revisar `referencia` / `idProducto` |
| Buscar bodega o tipo de envío no filtra | Esas columnas se ven, pero `applyFilters` no las compara | Buscar por referencia, cliente, proveedor, fecha, bultos o estatus |
| Orden de “Fecha de Llegada” raro | El sort compara el texto `es-ES` ya formateado, no la fecha | Esperado; no es el orden del SP |
| Al editar, el form dice producto nuevo y el icono dice clasificado | El icono usa `clasificado`. El form no lo lee: espera blur/`validar-post` y un `clasificacion` de 10 dígitos que `detalle-entrada` no trae | Salir del número de parte para revalidar |
| Al guardar una edición aparece `REVISION` duplicado | Las notas conservan el `REVISION` viejo y, si la descripción sigue vacía, se antepone otro | Quitar `REVISION` de las notas o llenar descripción |
| Cerrar Previo “no hace nada” y el modal ya no está | El modal se cierra antes del GET; el resultado es solo toast. `bultosTotales` / `bultosPrevio` no se muestran | Leer el toast. 404 = SP sin fila; 401 = JWT sin `NameIdentifier` |
| Token TL “cierra sesión” | No debería: 401 de `valida-token-teamleader` está exceptuado | Si cierra, el 401 vino de otra URL |
| Multibulto parcial | Un `registrar-partida` por bulto; algunos `estatus: false`. El form igual se resetea y se queda abierto | Toast lista el bulto que falló; los éxitos no se revierten |
| Borrar partida “no cierra” el modal | `estatus: false` no llama `setPartidaToDelete(null)`. Mientras `deleting` es true, la X no cierra | Leer el toast. Si es true, el modal se cierra y `refreshPartidas()` corre en silencio si falla |
| Cerrar Previo deshabilitado | Falta checkbox “He verificado los desgloses…” | Marcar; `idUsuario` sale del JWT, no del form |
| No aparece “Reabrir” | Hace falta búsqueda **sin filas** + `existe-previo-cerrado.estatus === true` (debounce 400 ms) | El KPI/filtro de cliente también vacía la tabla; el check usa el término de búsqueda |
| Reabrir con contraseña vacía falla | La UI habilita Validar solo con `usuario`; la API exige password (**400** “Contraseña es requerida”) | El modal ya se cerró; el error queda en el toast |
| Reabrir con credenciales que el SP no reconoce | Sin fila, `PuedeReabrirPrevio` retorna null → **500**, no `puedeRegenerar: false` | El toast muestra el `message` del 500 |
| Reabrir abre otra referencia | `navigate` usa el **término de búsqueda**, no `item.idEntrada` | Buscar el id exacto |
| Filtro de cliente “no filtra” | Desmarcar todos deja la lista vacía y `applyFilters` ignora el filtro si `clients.length === 0` | Volver a marcar “todos” |
| Cantidad no deja guardar sin token | `spCantidades` (separadas por coma) no incluye el valor; blur abre modal de TL | Token, o cancelar para volver a la primera sugerida |
| Descripción opcional y comentarios “REVISION” | Clasificación que no son 10 dígitos = producto no clasificado; descripción vacía se manda como `REVISION` en `comentarios` | Esperado para producto nuevo |
| Toast de fotografías y no hay dónde subirlas | El texto sale de `validar-post` (producto no clasificado o respuesta vacía). No hay control de imagen | Esperado. El efecto es descripción opcional y, si va vacía, `REVISION` en comentarios |
| Al corregir el número de parte se borran las series y vuelve a pedir token | Cada tecla llama `resetSpInfo()`: vacía `mmsEntries` y las autorizaciones de UM, país y cantidad, antes del blur | Volver a capturar series y, si aplica, el token. En OpenPO el input se deshabilita en cuanto hay número de parte: usar el lápiz |
| OpenPO pide token de TL aunque el SP no traía Standard Pack | Un 200 vacío (o un 404) de `validatePartNumberForOpenPO` copia UM/país del PO a `isSpum`/`spUm` e `isSppo`/`spPo` | Esperado en ese camino. El blur manual no inventa esos flags: borra UM y país si la respuesta está vacía |
| “Todos los productos del OpenPO han sido capturados” y la lista de POs está vacía | `poOptions.length === 0` también cuando `detalle-pos` falla (`openPOData` queda `[]`) | Revisar el GET de POs; el alerta no distingue el fallo |
| El SP devolvió `spMms` y el form no lo muestra | El estado guarda `spMms` y el JSX no lo pinta. El aviso es el texto fijo de MMS | No es un fallo de red |
| No aparece el form de partida, solo el combo de bulto | El resto se renderiza tras `isBultoLocked`. Las opciones son `idBulto` de `detalle-entrada`. Sin filas, el combo va vacío | El SP tiene que devolver bultos; no se escribe un id a mano |
| `isRrmms` o `spCantidades` “no aplican” | Esos campos no evitan el caso “respuesta vacía”. Sin clasificación, descripción ni `isSpum`/`isSppo`/`isSpmms`, el form hace `resetSpInfo()` | Confirmar que el SP también manda uno de esos tres flags o un texto de clasificación |
| Token TL usa otro usuario que la partida | El POST de TL manda `user.usuario`; la partida manda `idUsuario \|\| usuario` | Si `usuario` viene vacío, TL sale como `"unknown"` |
| `getClasificacion` 404 | GET inexistente | Usar `POST /api/Clasificacion/validar-post` |
| Cuarentenas no corren al cerrar | No hay cliente UI. Llamado a mano, cero filas del SP es **200** `{ success: false, items: [] }`, no 404. `idEntrada` vacío igual ejecuta el SP | Endpoint existe; no está en el flujo |
| Listado de pendientes 500 | `ruta_documento` con URL que `new Uri` no parsea | Corregir el SP / dato; tumba **todo** el listado |
| 500 incluye texto de SQL | El JSON trae `error` = `Exception.Message` | No reenviar ese body; revisar el SP o el dato |
| Chip “Pendientes” del Header | `total - Documento Listo`, no el KPI “Sin Documentos” | Esperado |
| Columna IA siempre “—” | El map fuerza `ai: false` | No hay campo de API |
| Fecha de llegada año 1 | `fecha_entrada` NULL se mapea a `DateTime.MinValue` (`0001-01-01`). El dashboard formatea cualquier string no vacío | No es una fecha real del SP. `fecha_previo` nulo no se pinta |
| “N partidas agregadas a este bulto” no coincide con la lista | Es `partidasCount` de la sesión del form. Se pone en 0 al desbloquear el bulto | La lista real sale de `detalle-entrada` al cerrar o al refrescar |
| No puedo cambiar de bulto | Elegir bulto pone `isBultoLocked`. El checkbox Multibulto se oculta | Botón de repetir al lado del combo; limpia la selección |

## PDF / IIS

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `Failed to fetch dynamically imported module` (worker) | IIS no sirve `.mjs` | `public/web.config` ya mapea `application/javascript` |
| Rutas internas 404 en IIS | Falta rewrite SPA | Misma `web.config`: no-archivo → `index.html` |
| Worker 404 en prod | No se copió `pdf.worker.min.mjs` | El plugin Vite lo pone en `dist/` al build |
| PDF 502 | Timeout 30 s, host remoto caído, o el origen respondió no-2xx | `HttpClient` se crea **por request** (sin pool). El `using` termina al devolver `File(stream)`; el body no se copia a un buffer |
| PDF no pide proxy | Same-origin | Esperado |
| El visor carga el PDF y “Abrir en nueva pestaña” no | `window.open` usa `rutaDocumento` cruda, sin `pdf-proxy` ni JWT | Usar el visor, o abrir una URL que el navegador pueda pedir solo |
| Al cambiar de documento el visor dice error y no hay paginador | `pageNum` no vuelve a 1. `getPage` falla y `PdfOcrViewer` reemplaza su toolbar por el error | Volver al documento que tenga al menos esa página y bajar, o recargar la captura |
| “Ver expediente” no es el iframe de `VITE_AB3_URL` | El botón está fijo a `https://web.aduax.com/Arrivedexp/referencias.aspx?id={reference}&r=0` | Esperado; la env var no se lee en `src/` |
| El modal de copiar texto OCR no aparece | `runOcr` solo corre con `forceSelectionMode`, y eso es el botón de recorte del número de parte. El modal es la otra rama y no se alcanza | El texto OCR entra al input de número de parte, no a un modal |

## Build / deploy

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `dotnet build` no encuentra metadata | HintPaths de `onecore.security.*` fuera del repo | Colocar las DLLs o ajustar HintPath |
| Cambio de connection string no aplica | `appsettings.json` es `EmbeddedResource` | Reconstruir; override `ConnectionStrings__DefaultConnection` |
| Swagger 404 en preprod | `UseSwagger` solo en Development | Esperado |
| Front llama `192.168.6.185` | Build sin `VITE_API_BASE_URL` | Definir `.env.production` o variable de CI |

## Qué no está implementado (no reportar como regresión)

- Refresh de JWT / registro de usuarios.
- Cliente de `validar-cuarentenas`.
- `GET /api/Clasificacion/{entrada}/{producto}`.
- Uso de `VITE_AB3_URL` y de `RETRY_ATTEMPTS`. “Ver expediente” no la consulta: abre `web.aduax.com/Arrivedexp/referencias.aspx`.
- Modal “Texto extraído (OCR)”: la rama existe en `CaptureView`, pero `runOcr` solo corre en modo número de parte.
- Persistencia del `refreshToken`.
- Columna IA del dashboard.
