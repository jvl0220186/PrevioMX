# Endpoints de dominio PrevioMX

Referencia de endpoints verificada contra los controllers en `PrevioMX_Api/Controllers` y los servicios del frontend en `PrevioMX_Web/src/services/previo.service.js`.

## Convenciones

- Base local de API: `https://localhost:5001`.
- Todos los endpoints de `Visualization`, `Catalogos`, `Clasificacion` y `Protected` requieren JWT.
- Enviar el token como `Authorization: Bearer {token}`.
- `POST /api/Auth/login` es el punto de entrada anonimo para obtener el JWT.
- `POST /api/Auth/register` y `POST /api/Auth/refresh` existen en el controller, pero `AuthService` todavia retorna `null`; no son flujos funcionales.

## Autenticacion

| Metodo | Ruta | Auth | Implementacion | Notas |
| --- | --- | --- | --- | --- |
| POST | `/api/Auth/login` | No | `AuthService.LoginAsync` -> `AuthDbContext.LoginAsync` -> `CSP_PMX_Login` | Request `{ "usuario": "...", "password": "..." }`. Devuelve `token`, `refreshToken` y `user` con `idUsuario`, `usuario`, `correoElectronico`, `equipo`, `grupoId`, `lider`. |
| POST | `/api/Auth/register` | No | `AuthService.RegisterAsync` | Expuesto pero no implementado; devuelve conflicto porque el servicio retorna `null`. |
| POST | `/api/Auth/refresh` | No | `AuthService.RefreshTokenAsync` | Expuesto pero no implementado; el frontend redirige al login si el token expira. |

## Dashboard y reapertura

| Metodo | Ruta | Stored procedure | Consumidor web | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/Visualization/pendientes/{equipo}` | `CSP_PMX_ObtenerPendientes` | `DashboardView.jsx` -> `previoService.getPendientes` | Carga pendientes del equipo del usuario autenticado. La respuesta incluye documentos separados por `|`, convertidos a lista por la API. |
| GET | `/api/Visualization/existe-previo-cerrado/{referencia}` | `csp_PMX_ExistePrevioCerrado` | `DashboardView.jsx` -> `existePrevioCerrado` | Se consulta cuando una busqueda no tiene resultados para saber si puede mostrarse "Reabrir previo". |
| POST | `/api/Visualization/puede-reabrir-previo` | `sp_previo_TL` | `DashboardView.jsx` -> `puedeReabrirPrevio` | Valida credenciales con `{ usuario, password }` antes de reabrir. |
| GET | `/api/Visualization/reabre-previo/{referencia}` | `csp_PMX_ReabrirPrevio` | `DashboardView.jsx` -> `reabrePrevio` | Devuelve un pendiente reabierto; el frontend lo guarda en `localStorage.captureData` y navega a captura. |

## Captura de previo

| Metodo | Ruta | Stored procedure | Consumidor web | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/Visualization/detalle-entrada/{idEntrada}` | `CSP_PMX_DetalleEntrada` | `CaptureView.jsx` -> `getDetalleEntrada` | Carga bultos y partidas existentes; alimenta KPIs, lista de partidas y deteccion de OpenPO. |
| GET | `/api/Visualization/proveedor-previo/{referencia}` | `csp_PMX_GetProveedorPrevio` | `CaptureView.jsx` -> `proveedorPrevio` | Obtiene proveedor vigente para mostrar y enviar en partidas. |
| GET | `/api/Visualization/detalle-pos/{idEntrada}` | `CSP_PMX_DetallePOs` | `CaptureView.jsx`, `AddPartidasForm.jsx` -> `getDetallePOs` | Solo se consulta cuando la entrada se detecta como OpenPO. |
| POST | `/api/Visualization/agregar-openpo` | `csp_PMX_AgregarOpenPO` | `AddPartidasForm.jsx` -> `agregarOpenPO` | Agrega un PO a la referencia. Requiere `referencia`, `po` y `packing`. |
| POST | `/api/Clasificacion/validar` | `CSP_PMX_ValidarClasificacion` | Sin consumo directo actual | Valida producto por `idEntrada` e `idProducto`. |
| POST | `/api/Clasificacion/validar-post` | `CSP_PMX_ValidarClasificacion` | `AddPartidasForm.jsx` -> `validarPost` | Valida clasificacion y Standard Pack antes de registrar o actualizar. |
| POST | `/api/Visualization/validar-marca` | `csp_PMX_ValidaMarca` | `AddPartidasForm.jsx` -> `validarMarca` | Verifica marca capturada cuando el producto ya tiene clasificacion. |
| POST | `/api/Visualization/validar-modelo` | `csp_PMX_ValidaModelo` | `AddPartidasForm.jsx` -> `validarModelo` | Verifica modelo capturado cuando el producto ya tiene clasificacion. |
| POST | `/api/Protected/valida-token-teamleader` | `SP_FEA_ValidarTokenTeamleader_Result` | `AddPartidasForm.jsx` -> `validarTokenTeamLeader` | Autoriza diferencias contra Standard Pack o cambios sensibles de cantidad, unidad o pais. Un 401 no redirige al login en el interceptor. |
| POST | `/api/Visualization/registrar-partida` | `csp_PMX_RegistrarPartida` | `AddPartidasForm.jsx` -> `registrarPartida` | Registra una partida. El frontend puede repetir la llamada para multibulto. |
| PUT | `/api/Visualization/actualizar-partida` | `csp_PMX_ActualizarPartida` | `AddPartidasForm.jsx` -> `actualizarPartida` | Actualiza partida existente. Requiere `id > 0`, `idBulto` e `idProducto`. |
| DELETE | `/api/Visualization/eliminar-partida` | `csp_PMX_EliminarPartida` | `CaptureView.jsx` -> `eliminarPartida` | Elimina una partida con body JSON; requiere `idBulto`, `referencia` e `idProducto`. |
| GET | `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `CSP_PMX_ValidarCierrePrevio` | `CaptureView.jsx` -> `validarCierrePrevio` | Cierra o valida cierre del previo usando el `idUsuario` tomado del JWT. |
| POST | `/api/Visualization/validar-cuarentenas` | `CSP_PMX_ValidarCuarentenas` | Sin consumo web actual | Valida cuarentenas por `idEntrada` e `idUsuario`. |

## Catalogos

| Metodo | Ruta | Stored procedure | Consumidor web | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/Catalogos/{catalogo}` | `CSP_PMX_Catalogos` | `CaptureView.jsx` -> `getCatalogo` | IDs usados por captura: `1` unidades de medida, `2` paises. |
| POST | `/api/Catalogos/catalogo-proveedores` | `csp_PMX_ProveedoresListarPaginado` | `ProveedoresCombo.jsx` -> `getCatalogoProveedores` | Busqueda paginada de proveedores con `filtro`, `pageNumber`, `pageSize`. |

## PDF y OCR

| Metodo | Ruta | Stored procedure | Consumidor web | Uso |
| --- | --- | --- | --- | --- |
| GET | `/api/Visualization/pdf-proxy?url={url}` | No aplica | `PdfOcrViewer.jsx` | Evita CORS al cargar PDFs externos. Solo permite URLs HTTPS de `grupoei.com.mx`, `aduax.com` y subdominios, o hosts `*.amazonaws.com`. |

El frontend agrega el header `Authorization` al proxy cuando usa una URL de otro origen.

## Diferencias conocidas entre cliente y API

- `previoService.getClasificacion(idEntrada, idProducto)` apunta a `GET /api/Clasificacion/{idEntrada}/{idProducto}`, pero el controller solo expone `POST /api/Clasificacion/validar` y `POST /api/Clasificacion/validar-post`. El flujo actual usa `validarPost`.
- `validar-cuarentenas` existe en API y servicio de backend, pero no tiene consumidor web directo en `previo.service.js`.
- `WeatherForecast` y `Protected/test` son endpoints de prueba; no describen el flujo operativo de PrevioMX.
