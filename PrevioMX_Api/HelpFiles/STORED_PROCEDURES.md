# Stored procedures usados por PrevioMX API

Inventario verificado contra `PrevioMX_Api/Business/AuthDbContext.cs`.

La API no usa migraciones EF para las operaciones de dominio; `AuthDbContext` abre conexion a SQL Server y ejecuta stored procedures existentes. Mantener este archivo sincronizado cuando cambien rutas de `Controllers/*`, servicios de `Business/*Service.cs` o DTOs.

## Conexion y responsabilidades

- `Program.cs` registra `AuthDbContext` con `ConnectionStrings:DefaultConnection`.
- Los controllers llaman servicios (`AuthService`, `VisualizationService`, `CatalogosService`, `ClasificacionService`).
- Los servicios delegan en `AuthDbContext`, donde estan las llamadas SQL.
- Las respuestas se mapean a DTOs en `PrevioMX_Api/DTO`.

## Autenticacion

| Stored procedure | Metodo C# | Endpoint | Parametros principales | Resultado |
| --- | --- | --- | --- | --- |
| `CSP_PMX_Login` | `LoginAsync` | `POST /api/Auth/login` | `@P_USUARIO`, `@P_PASSWORD` | `LoginResultDto`; se convierte a JWT y `UserDto`. |

`AuthService.RegisterAsync` y `AuthService.RefreshTokenAsync` no estan implementados. Aunque `AuthDbContext` conserva metodos de plantilla para `sp_RegisterUser`, `sp_UpdateRefreshToken`, `sp_GetUserByRefreshToken` y `sp_EmailExists`, esos flujos no son usados por el login operativo actual.

## Catalogos

| Stored procedure | Metodo C# | Endpoint | Parametros | Notas |
| --- | --- | --- | --- | --- |
| `CSP_PMX_Catalogos` | `GetCatalogosAsync` | `GET /api/Catalogos/{catalogo}` | `@P_CATALOGO` | Captura usa `1` para unidades y `2` para paises. |
| `csp_PMX_ProveedoresListarPaginado` | `GetCatalogoProveedoresPaginadoAsync` | `POST /api/Catalogos/catalogo-proveedores` | `@Filtro`, `@PageNumber`, `@PageSize` | Devuelve filas con `TotalRows`; `CatalogosService` calcula `totalPages` y `more`. |

## Dashboard

| Stored procedure | Metodo C# | Endpoint | Parametros | Notas |
| --- | --- | --- | --- | --- |
| `CSP_PMX_ObtenerPendientes` | `GetPendientesAsync` | `GET /api/Visualization/pendientes/{equipo}` | `@EQUIPO` | Lee documentos desde `ruta_documento` separada por `|` y los transforma a `PendienteDocumentosResponseDto`. |
| `csp_PMX_ExistePrevioCerrado` | `GetExistePrevioCerradoAsync` | `GET /api/Visualization/existe-previo-cerrado/{referencia}` | `@referencia` | Determina si puede mostrarse la accion "Reabrir previo". |
| `sp_previo_TL` | `PuedeReabrirPrevio` | `POST /api/Visualization/puede-reabrir-previo` | `@usuario`, `@password`, `@REIMPRESION` | Valida credenciales/permisos de reapertura. |
| `csp_PMX_ReabrirPrevio` | `ReabrePrevio` | `GET /api/Visualization/reabre-previo/{referencia}` | `@referencia` | Regresa datos tipo pendiente para navegar a captura. |

## Captura y partidas

| Stored procedure | Metodo C# | Endpoint | Parametros principales | Notas |
| --- | --- | --- | --- | --- |
| `CSP_PMX_DetalleEntrada` | `GetDetalleEntradaAsync` | `GET /api/Visualization/detalle-entrada/{idEntrada}` | `@ID_ENTRADA` | Fuente de bultos, partidas, documentos y bandera OpenPO. |
| `csp_PMX_GetProveedorPrevio` | `GetProveedorPrevioAsync` | `GET /api/Visualization/proveedor-previo/{referencia}` | `@referencia` | Refresca proveedor asociado al previo. |
| `CSP_PMX_DetallePOs` | `GetDetallePOsAsync` | `GET /api/Visualization/detalle-pos/{idEntrada}` | `@ID_ENTRADA` | Consulta POs y productos de entradas OpenPO. |
| `csp_PMX_AgregarOpenPO` | `AgregarOpenPOAsync` | `POST /api/Visualization/agregar-openpo` | `@Referencia`, `@po`, `@packing` | Agrega PO manualmente a una referencia. |
| `CSP_PMX_ValidarClasificacion` | `GetValidarClasificacionAsync` | `POST /api/Clasificacion/validar-post` | `@ID_ENTRADA`, `@ID_PRODUCTO` | Devuelve clasificacion, descripcion y datos Standard Pack. |
| `csp_PMX_ValidaMarca` | `ValidarMarcaAsync` | `POST /api/Visualization/validar-marca` | `@Referencia`, `@id_producto`, `@marca_registro` | Valida marca capturada. |
| `csp_PMX_ValidaModelo` | `ValidarModeloAsync` | `POST /api/Visualization/validar-modelo` | `@Referencia`, `@id_producto`, `@modelo_registro` | Valida modelo capturado. |
| `SP_FEA_ValidarTokenTeamleader_Result` | `ValidarTokenTeamleaderAsync` | `POST /api/Protected/valida-token-teamleader` | `@usuario`, `@token` | Autoriza diferencias de captura mediante token Team Leader. |
| `csp_PMX_RegistrarPartida` | `RegistrarPartidaAsync` | `POST /api/Visualization/registrar-partida` | `@idbulto`, `@Referencia`, `@idproveedor`, `@id_producto`, `@um`, `@cantidad`, `@subcantidad`, `@pais_origen`, `@comentarios`, `@usuario`, `@oc_compra`, `@no_parte_fisico`, `@mms` | Usado tambien en multibulto, una llamada por bulto. |
| `csp_PMX_ActualizarPartida` | `ActualizarPartidaAsync` | `PUT /api/Visualization/actualizar-partida` | Incluye `@id` mas los campos de partida | Actualiza partidas existentes. |
| `csp_PMX_EliminarPartida` | `EliminarPartidaAsync` | `DELETE /api/Visualization/eliminar-partida` | `@id`, `@idbulto`, `@Referencia`, `@id_producto` | El controller exige `idBulto`, `referencia` e `idProducto`. |
| `CSP_PMX_ValidarCierrePrevio` | `GetValidarCierrePrevioAsync` | `GET /api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` | El `idUsuario` sale del claim `NameIdentifier` del JWT. |
| `CSP_PMX_ValidarCuarentenas` | `ValidarCuarentenasAsync` | `POST /api/Visualization/validar-cuarentenas` | `@ID_ENTRADA`, `@ID_USUARIO` | Endpoint disponible; sin consumidor web directo actual. |

## Metodos de plantilla no operativos

Estos metodos permanecen en `AuthDbContext`, pero no respaldan un flujo habilitado por `AuthService`:

| Stored procedure | Metodo C# | Estado |
| --- | --- | --- |
| `sp_RegisterUser` | `RegisterUserAsync` | No usado porque `RegisterAsync` retorna `null`. |
| `sp_UpdateRefreshToken` | `UpdateRefreshTokenAsync` | No usado por refresh actual. |
| `sp_GetUserByRefreshToken` | `GetUserByRefreshTokenAsync` | No usado por refresh actual. |
| `sp_EmailExists` | `EmailExistsAsync` | No usado por register actual. |

No crear nuevos scripts desde esta seccion sin validar primero si el flujo de autenticacion sera implementado o retirado.

## Permisos minimos esperados

El usuario configurado en `DefaultConnection` debe poder:

- Ejecutar los procedures listados arriba.
- Leer los result sets con los nombres de columna que esperan los DTOs.
- Abrir multiples consultas por request en el flujo de captura (`detalle-entrada`, catalogos, proveedor y, si aplica, `detalle-pos`).

## Checklist al cambiar un stored procedure

1. Revisar el metodo correspondiente en `AuthDbContext.cs`.
2. Confirmar que los nombres de columnas siguen alineados con el DTO.
3. Actualizar `ENDPOINTS_DOMINIO.md` si cambia endpoint, request o respuesta.
4. Probar el consumidor frontend en `previo.service.js` y la vista que lo invoca.

