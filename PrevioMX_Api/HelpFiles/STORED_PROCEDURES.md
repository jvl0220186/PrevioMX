# Stored procedures usados por PrevioMX

La API no usa tablas EF tradicionales para la mayoría de operaciones de negocio. `AuthDbContext` ejecuta stored procedures de SQL Server y mapea resultsets a DTOs.

Inventario verificado contra `PrevioMX_Api/Business/AuthDbContext.cs`.

## Reglas generales

- Connection string requerida: `ConnectionStrings:DefaultConnection`.
- El usuario SQL necesita `EXECUTE` sobre los procedimientos listados.
- Los nombres de columnas del resultset deben coincidir con los accesos del código (`DbDataReader` / `SqlQueryRaw`).
- Los métodos que abren la conexión manualmente hacen `CloseAsync()` en `finally`.

## Autenticación

| Procedimiento | Método C# | Endpoint | Parámetros | Resultset esperado |
| --- | --- | --- | --- | --- |
| `CSP_PMX_Login` | `LoginAsync` | `POST /api/Auth/login` | `@P_USUARIO`, `@P_PASSWORD` | `IdUsuario`, `Usuario`, `CorreoElectronico`, `Equipo`, `GrupoId`, `Lider` |

Notas:

- `AuthService.LoginAsync` es el único flujo de autenticación operativo.
- El JWT se genera después de recibir `LoginResultDto`.

### Helpers de usuario no activos

`AuthDbContext` contiene helpers para `sp_RegisterUser`, `sp_UpdateRefreshToken`, `sp_GetUserByRefreshToken` y `sp_EmailExists`, pero `AuthService.RegisterAsync` / `RefreshTokenAsync` devuelven `null`. `POST /api/Auth/register` y `POST /api/Auth/refresh` no son funcionales.

## Catálogos

| Procedimiento | Método C# | Endpoint | Parámetros | Resultset |
| --- | --- | --- | --- | --- |
| `CSP_PMX_Catalogos` | `GetCatalogosAsync` | `GET /api/Catalogos/{catalogo}` | `@P_CATALOGO` | `cValue`, `cText` |
| `csp_PMX_ProveedoresListarPaginado` | `GetCatalogoProveedoresPaginadoAsync` | `POST /api/Catalogos/catalogo-proveedores` | `@Filtro`, `@PageNumber`, `@PageSize` | `cValue`, `cText` |

Uso frontend: catálogo `1` = unidades, `2` = países.

## Dashboard y detalle

| Procedimiento | Método C# | Endpoint | Parámetros | Columnas relevantes |
| --- | --- | --- | --- | --- |
| `CSP_PMX_ObtenerPendientes` | `GetPendientesAsync` | `GET /api/Visualization/pendientes/{equipo}` | `@EQUIPO` | `id_entrada`, bodega/cliente/proveedor, `bultos`, `estatus`, `ruta_documento`, `es_openpo`, ... |
| `CSP_PMX_DetalleEntrada` | `GetDetalleEntradaAsync` | `GET /api/Visualization/detalle-entrada/{idEntrada}` | `@ID_ENTRADA` | partidas + `EsOpenPO` + `MMS` |
| `CSP_PMX_DetallePOs` | `GetDetallePOsAsync` | `GET /api/Visualization/detalle-pos/{idEntrada}` | `@ID_ENTRADA` | `po`, `id_producto`, `cantidad`, `um`, `pais_origen`, ... |

- `ruta_documento` puede traer varias URLs separadas por `|`.
- `EsOpenPO = true` activa la consulta a `CSP_PMX_DetallePOs`.

## Captura y mantenimiento de partidas

| Procedimiento | Método C# | Endpoint | Parámetros |
| --- | --- | --- | --- |
| `csp_PMX_RegistrarPartida` | `RegistrarPartidaAsync` | `POST /api/Visualization/registrar-partida` | `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms` |
| `csp_PMX_ActualizarPartida` | `ActualizarPartidaAsync` | `PUT /api/Visualization/actualizar-partida` | `@id` + mismos campos de registro |
| `csp_PMX_EliminarPartida` | `EliminarPartidaAsync` | `DELETE /api/Visualization/eliminar-partida` | `@id`, `@idbulto`, `@Referencia`, `@id_producto` |
| `csp_PMX_AgregarOpenPO` | `AgregarOpenPOAsync` | `POST /api/Visualization/agregar-openpo` | `@Referencia`, `@po`, `@packing` |

Resultset esperado:

```text
estatus bit
msg varchar/nvarchar
```

Validaciones en controller:

- Registrar: `IdBulto` e `IdProducto` requeridos.
- Actualizar: `Id > 0`, `IdBulto` e `IdProducto` requeridos.
- Eliminar: `IdBulto`, `Referencia` e `IdProducto` requeridos.
- Agregar OpenPO: `Referencia`, `Po` y `Packing` requeridos.

### Formato de `@mms`

Cadena construida en `AddPartidasForm`:

```text
marca1|modelo1|serie1~marca2|modelo2|serie2
```

Vacía cuando no hay series. Si `is_rrmms = true`, el frontend exige tantas series como la cantidad capturada.

## Validaciones de producto y cierre

| Procedimiento | Método C# | Endpoint | Parámetros | Resultset |
| --- | --- | --- | --- | --- |
| `CSP_PMX_ValidarClasificacion` | `GetValidarClasificacionAsync` | `POST /api/Clasificacion/validar` y `POST /api/Clasificacion/validar-post` | `@ID_ENTRADA`, `@ID_PRODUCTO` | `clasificacion`, `descripcion`, `is_spum`, `sp_um`, `is_sppo`, `sp_po`, `is_spmms`, `sp_mms`, `sp_cantidades`, `is_rrmms` |
| `CSP_PMX_ValidarCierrePrevio` | `GetValidarCierrePrevioAsync` | `GET /api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` | `estatus`, `bultos_totales`, `bultos_previo`, `msg` |
| `CSP_PMX_ValidarCuarentenas` | `ValidarCuarentenasAsync` | `POST /api/Visualization/validar-cuarentenas` | `@ID_ENTRADA`, `@ID_USUARIO` | `EXITO`, `MENSAJE` |
| `csp_PMX_ValidaMarca` | `ValidarMarcaAsync` | `POST /api/Visualization/validar-marca` | `@Referencia`, `@id_producto`, `@marca_registro` | `Valido` |
| `csp_PMX_ValidaModelo` | `ValidarModeloAsync` | `POST /api/Visualization/validar-modelo` | `@Referencia`, `@id_producto`, `@modelo_registro` | `Valido` |
| `SP_FEA_ValidarTokenTeamleader_Result` | `ValidarTokenTeamleaderAsync` | `POST /api/Protected/valida-token-teamleader` | `@usuario`, `@token` | `Correcto`, `Mensaje`, `UsuarioAprobo` |

Notas MMS / Standard Pack:

- `is_spmms`: el UI muestra el bloque Marca/Modelo/Serie.
- `is_rrmms`: el UI exige que el número de series = cantidad.
- En cierre de previo, `@ID_USUARIO` sale del claim `ClaimTypes.NameIdentifier`.

## Reapertura de previo

| Procedimiento | Método C# | Endpoint | Parámetros | Resultset |
| --- | --- | --- | --- | --- |
| `csp_PMX_ExistePrevioCerrado` | `GetExistePrevioCerradoAsync` | `GET /api/Visualization/existe-previo-cerrado/{referencia}` | `@referencia` | `estatus`, `msg` |
| `csp_PMX_GetProveedorPrevio` | `GetProveedorPrevioAsync` | `GET /api/Visualization/proveedor-previo/{referencia}` | `@referencia` | `idProveedor`, `proveedor`, `estatus`, `msg` |
| `sp_previo_TL` | `PuedeReabrirPrevio` | `POST /api/Visualization/puede-reabrir-previo` | `@usuario`, `@password`, `@REIMPRESION = 0` | fila presente => `puedeRegenerar = true` |
| `csp_PMX_ReabrirPrevio` | `ReabrePrevio` | `GET /api/Visualization/reabre-previo/{referencia}` | `@referencia` | shape de `PendienteDto` |

## Checklist al agregar un nuevo stored procedure

1. Agregar método en `AuthDbContext` con parámetros tipados.
2. Mapear columnas nulas de forma defensiva.
3. Exponerlo por interfaz de negocio antes del controller.
4. Documentar endpoint, parámetros y columnas aquí.
5. Si el frontend lo consume, agregar método en `src/services/previo.service.js`.
