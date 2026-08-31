# Stored procedures invocados

Inventario **solo** de lo que ejecuta `AuthDbContext`. No hay scripts `CREATE` en este repo: los SPs viven en Aduasis. No inventar `sp_GetUserByEmail` ni tabla `Users` para autenticación.

## Autenticación

| SP | Método | Parámetros | Resultado mapeado |
|----|--------|------------|-------------------|
| `CSP_PMX_Login` | `LoginAsync` | `@P_USUARIO`, `@P_PASSWORD` | `LoginResultDto` (idUsuario, usuario, correoElectronico, equipo, grupoId, lider) |

Login es el único SP de auth en el flujo vivo.

### Scaffold no usado por AuthService

`RegisterUserAsync` → `sp_RegisterUser`, `UpdateRefreshTokenAsync` → `sp_UpdateRefreshToken`, `GetUserByRefreshTokenAsync` → `sp_GetUserByRefreshToken`, `EmailExistsAsync` → `sp_EmailExists`. `RegisterAsync` / `RefreshTokenAsync` retornan `null` sin llamarlos.

## Catálogos

| SP | Método | Parámetros | Notas |
|----|--------|------------|-------|
| `CSP_PMX_Catalogos` | `GetCatalogosAsync` | `@P_CATALOGO` (int) | Columnas `c_value`, `c_text`. UI: `1` = UM, `2` = países |
| `csp_PMX_ProveedoresListarPaginado` | `GetCatalogoProveedoresPaginadoAsync` | `@Filtro`, `@PageNumber`, `@PageSize` | Incluye `TotalRows` |

## Visualización y captura

| SP | Método | Parámetros |
|----|--------|------------|
| `CSP_PMX_ObtenerPendientes` | `GetPendientesAsync` | `@EQUIPO` |
| `CSP_PMX_DetalleEntrada` | `GetDetalleEntradaAsync` | `@ID_ENTRADA` |
| `CSP_PMX_ValidarCierrePrevio` | `GetValidarCierrePrevioAsync` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` |
| `CSP_PMX_ValidarClasificacion` | `GetValidarClasificacionAsync` | `@ID_ENTRADA`, `@ID_PRODUCTO` |
| `csp_PMX_RegistrarPartida` | `RegistrarPartidaAsync` | `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms` |
| `csp_PMX_ActualizarPartida` | `ActualizarPartidaAsync` | iguales + `@id` |
| `csp_PMX_EliminarPartida` | `EliminarPartidaAsync` | `@id`, `@idbulto`, `@Referencia`, `@id_producto` |
| `CSP_PMX_DetallePOs` | `GetDetallePOsAsync` | `@ID_ENTRADA` |
| `csp_PMX_AgregarOpenPO` | `AgregarOpenPOAsync` | `@Referencia`, `@po`, `@packing` |
| `CSP_PMX_ValidarCuarentenas` | `ValidarCuarentenasAsync` | `@ID_ENTRADA`, `@ID_USUARIO` |
| `csp_PMX_ValidaMarca` | `ValidarMarcaAsync` | `@Referencia`, `@id_producto`, `@marca_registro` |
| `csp_PMX_ValidaModelo` | `ValidarModeloAsync` | `@Referencia`, `@id_producto`, `@modelo_registro` |
| `csp_PMX_ExistePrevioCerrado` | `GetExistePrevioCerradoAsync` | `@referencia` |
| `csp_PMX_GetProveedorPrevio` | `GetProveedorPrevioAsync` | `@referencia` |
| `csp_PMX_ReabrirPrevio` | `ReabrePrevio` | `@referencia` |

## Permisos / team leader

| SP | Método | Parámetros | Notas |
|----|--------|------------|-------|
| `SP_FEA_ValidarTokenTeamleader_Result` | `ValidarTokenTeamleaderAsync` | `@usuario`, `@token` | `ProtectedController` |
| `sp_previo_TL` | `PuedeReabrirPrevio` | `@usuario`, `@password`, `@REIMPRESION=0` | Si hay fila, el código **fuerza** `PuedeRegenerar=true` y `LUsuario=""` (lecturas comentadas) |

## Pendientes: documentos

`CSP_PMX_ObtenerPendientes` y `csp_PMX_ReabrirPrevio` leen `ruta_documento` como string separado por `|`. Cada URL se parte con `UrlFileServices.ExtracFileNameFromUrl`.

## Clasificación (Standard Pack / MMS)

`CSP_PMX_ValidarClasificacion` mapea: `clasificacion`, `descripcion`, `is_spum`, `sp_um`, `is_sppo`, `sp_po`, `is_spmms`, `sp_mms`, `sp_cantidades`, `is_rrmms`.

Ver [FLUJO_CAPTURA.md](../../PrevioMX_Web/docs/FLUJO_CAPTURA.md) para el significado en UI.
