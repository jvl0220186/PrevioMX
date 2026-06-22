# Stored procedures usados por PrevioMX

La API no usa tablas EF tradicionales para la mayoria de operaciones de negocio. `AuthDbContext` ejecuta stored procedures de SQL Server y mapea manualmente los resultsets a DTOs.

Este inventario fue verificado contra `PrevioMX_Api/Business/AuthDbContext.cs`.

## Reglas generales

- La connection string requerida es `ConnectionStrings:DefaultConnection`.
- El usuario SQL debe tener permisos `EXECUTE` sobre los procedimientos listados.
- Cuando el codigo usa `DbDataReader`, los nombres de columnas del resultset deben coincidir exactamente con los accesos del codigo.
- Los metodos que abren la conexion manualmente hacen `CloseAsync()` en `finally`; evita retornar readers vivos desde nuevos metodos.

## Autenticacion

| Procedimiento | Metodo C# | Endpoint | Parametros | Resultset esperado |
| --- | --- | --- | --- | --- |
| `CSP_PMX_Login` | `LoginAsync` | `POST /api/Auth/login` | `@P_USUARIO`, `@P_PASSWORD` | `LoginResultDto`: `IdUsuario`, `Usuario`, `CorreoElectronico`, `Equipo`, `GrupoId`, `Lider` |

Notas:

- `AuthService.LoginAsync` es el unico flujo de autenticacion operativo.
- El JWT se genera despues de recibir `LoginResultDto`.

### Procedimientos de usuario no activos en el flujo actual

`AuthDbContext` contiene helpers para:

- `sp_RegisterUser`
- `sp_UpdateRefreshToken`
- `sp_GetUserByRefreshToken`
- `sp_EmailExists`

Sin embargo, `AuthService.RegisterAsync` y `AuthService.RefreshTokenAsync` devuelven `null` y registran advertencias de "no implementado". Aunque los helpers existan, `POST /api/Auth/register` y `POST /api/Auth/refresh` no deben tratarse como funcionales hasta completar la capa de servicio.

## Catalogos

| Procedimiento | Metodo C# | Endpoint | Parametros | Resultset esperado |
| --- | --- | --- | --- | --- |
| `CSP_PMX_Catalogos` | `GetCatalogosAsync` | `GET /api/Catalogos/{catalogo}` | `@P_CATALOGO` | Items de catalogo (`cValue`, `cText`) |
| `csp_PMX_ProveedoresListarPaginado` | `GetCatalogoProveedoresPaginadoAsync` | `POST /api/Catalogos/catalogo-proveedores` | `@Filtro`, `@PageNumber`, `@PageSize` | Items paginados (`cValue`, `cText`) |

Uso frontend:

- Catalogo `1`: unidades.
- Catalogo `2`: paises.
- Proveedores paginados: modal de cambio de proveedor en captura.

## Dashboard y detalle de entrada

| Procedimiento | Metodo C# | Endpoint | Parametros | Columnas relevantes |
| --- | --- | --- | --- | --- |
| `CSP_PMX_ObtenerPendientes` | `GetPendientesAsync` | `GET /api/Visualization/pendientes/{equipo}` | `@EQUIPO` | `id_entrada`, `id_bodega`, `bodega`, `id_cliente`, `cliente`, `id_proveedor`, `proveedor`, `fecha_entrada`, `fecha_previo`, `bultos`, `tipo_envio`, `estatus`, `tipo_captura`, `fecha_documento`, `ruta_documento`, `es_openpo` |
| `CSP_PMX_DetalleEntrada` | `GetDetalleEntradaAsync` | `GET /api/Visualization/detalle-entrada/{idEntrada}` | `@ID_ENTRADA` | `id_entrada`, `id_bulto`, `id`, `id_producto`, `oc_compra`, `um`, `pais_origen`, `discrepancia`, `cantidad`, `cantidad_cartones`, `precio_unitario`, `comentarios`, `clasificado`, `series`, `EsOpenPO`, `descripcion_clas`, `MMS` |
| `CSP_PMX_DetallePOs` | `GetDetallePOsAsync` | `GET /api/Visualization/detalle-pos/{idEntrada}` | `@ID_ENTRADA` | `po`, `bultos`, `id_producto`, `cantidad`, `descripcion`, `pais_origen`, `um` |

Notas:

- `ruta_documento` puede contener varias URLs separadas por `|`; el API las transforma en `documentos`.
- `EsOpenPO` en detalle activa la consulta a `CSP_PMX_DetallePOs`.

## Captura y mantenimiento de partidas

| Procedimiento | Metodo C# | Endpoint | Parametros |
| --- | --- | --- | --- |
| `csp_PMX_RegistrarPartida` | `RegistrarPartidaAsync` | `POST /api/Visualization/registrar-partida` | `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms` |
| `csp_PMX_ActualizarPartida` | `ActualizarPartidaAsync` | `PUT /api/Visualization/actualizar-partida` | `@id`, `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms` |
| `csp_PMX_EliminarPartida` | `EliminarPartidaAsync` | `DELETE /api/Visualization/eliminar-partida` | `@id`, `@idbulto`, `@Referencia`, `@id_producto` |
| `csp_PMX_AgregarOpenPO` | `AgregarOpenPOAsync` | `POST /api/Visualization/agregar-openpo` | `@Referencia`, `@po`, `@packing` |

Resultset esperado para estas operaciones:

```text
estatus bit
msg varchar/nvarchar
```

Validaciones en controller:

- Registrar: `IdBulto` e `IdProducto` son requeridos.
- Actualizar: `Id > 0`, `IdBulto` e `IdProducto` son requeridos.
- Eliminar: `IdBulto`, `Referencia` e `IdProducto` son requeridos.
- Agregar OpenPO: `Referencia`, `Po` y `Packing` son requeridos.

## Validaciones de producto y cierre

| Procedimiento | Metodo C# | Endpoint | Parametros | Resultset esperado |
| --- | --- | --- | --- | --- |
| `CSP_PMX_ValidarClasificacion` | `GetValidarClasificacionAsync` | `GET /api/Clasificacion/{idEntrada}/{idProducto}` | `@ID_ENTRADA`, `@ID_PRODUCTO` | `clasificacion`, `descripcion`, `is_spum`, `sp_um`, `is_sppo`, `sp_po`, `is_spmms`, `sp_mms`, `sp_cantidades`, `is_rrmms` |
| `CSP_PMX_ValidarCierrePrevio` | `GetValidarCierrePrevioAsync` | `GET /api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` | `estatus`, `bultos_totales`, `bultos_previo`, `msg` |
| `CSP_PMX_ValidarCuarentenas` | `ValidarCuarentenasAsync` | `POST /api/Visualization/validar-cuarentenas` | `@ID_ENTRADA`, `@ID_USUARIO` | Filas con `EXITO`, `MENSAJE` |
| `csp_PMX_ValidaMarca` | `ValidarMarcaAsync` | `POST /api/Visualization/validar-marca` | `@Referencia`, `@id_producto`, `@marca_registro` | `Valido` |
| `csp_PMX_ValidaModelo` | `ValidarModeloAsync` | `POST /api/Visualization/validar-modelo` | `@Referencia`, `@id_producto`, `@modelo_registro` | `Valido` |
| `SP_FEA_ValidarTokenTeamleader_Result` | `ValidarTokenTeamleaderAsync` | `POST /api/Protected/valida-token-teamleader` | `@usuario`, `@token` | `Correcto`, `Mensaje`, `UsuarioAprobo` |

Notas:

- En cierre de previo, `@ID_USUARIO` sale del claim `ClaimTypes.NameIdentifier` del JWT.
- `ValidarCuarentenasAsync` marca `Success = true` solo si hay filas y todas tienen `EXITO = true`.

## Reapertura de previo

| Procedimiento | Metodo C# | Endpoint | Parametros | Resultset esperado |
| --- | --- | --- | --- | --- |
| `csp_PMX_ExistePrevioCerrado` | `GetExistePrevioCerradoAsync` | `GET /api/Visualization/existe-previo-cerrado/{referencia}` | `@referencia` | `estatus`, `msg` |
| `csp_PMX_GetProveedorPrevio` | `GetProveedorPrevioAsync` | `GET /api/Visualization/proveedor-previo/{referencia}` | `@referencia` | `idProveedor`, `proveedor`, `estatus`, `msg` |
| `sp_previo_TL` | `PuedeReabrirPrevio` | `POST /api/Visualization/puede-reabrir-previo` | `@usuario`, `@password`, `@REIMPRESION = 0` | Al menos una fila; el codigo devuelve `puedeRegenerar = true` si existe resultado |
| `csp_PMX_ReabrirPrevio` | `ReabrePrevio` | `GET /api/Visualization/reabre-previo/{referencia}` | `@referencia` | Mismo shape que `CSP_PMX_ObtenerPendientes` para un solo `PendienteDto` |

Flujo frontend:

1. Buscar referencia en dashboard.
2. Si la tabla queda sin resultados, llamar `existe-previo-cerrado`.
3. Si `estatus = true`, mostrar boton "Reabrir previo".
4. Validar credenciales especiales con `sp_previo_TL`.
5. Reabrir con `csp_PMX_ReabrirPrevio` y navegar a captura.

## Checklist al agregar un nuevo stored procedure

1. Agregar metodo en `AuthDbContext` con parametros tipados (`SqlParameter` o `DbParameter`).
2. Mapear columnas nulas defensivamente si el resultset viene de `DbDataReader`.
3. Exponerlo por una interfaz de negocio antes de usarlo en controller.
4. Documentar endpoint, parametros, columnas y errores esperados en este archivo.
5. Si el frontend lo consume, agregar el metodo en `src/services/previo.service.js` o servicio correspondiente.
