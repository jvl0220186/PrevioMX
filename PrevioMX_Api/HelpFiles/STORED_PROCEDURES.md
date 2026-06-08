# Stored procedures usados por PrevioMX

La API accede a SQL Server mediante `AuthDbContext`. Este documento inventaria
los stored procedures que el codigo invoca y los parametros que se envian desde
la aplicacion. No incluye scripts `CREATE PROCEDURE` porque el cuerpo de los
procedures vive en la base de datos `Aduasis` y no esta versionado en este
repositorio.

## Reglas de integracion

- Mantener nombres de columnas de salida compatibles con los DTOs leidos en
  `AuthDbContext`.
- Los endpoints protegidos requieren JWT; algunos procedures reciben el usuario
  explicitamente y otros lo derivan del token antes de ejecutarse.
- Las respuestas de operaciones de escritura suelen mapearse a
  `{ estatus: bool, msg: string }`.
- Si se cambia la firma de un procedure, actualizar tambien el DTO, el metodo de
  `AuthDbContext`, el servicio y la documentacion de endpoints.

## Autenticacion y sesiones

| Stored procedure | Metodo C# | Parametros enviados | Estado en la app |
| --- | --- | --- | --- |
| `CSP_PMX_Login` | `LoginAsync` | `@P_USUARIO`, `@P_PASSWORD` | Activo. Devuelve datos del usuario para emitir JWT. |
| `sp_RegisterUser` | `RegisterUserAsync` | `@Email`, `@Name`, `@PasswordHash`, `@RefreshToken`, `@RefreshTokenExpiryTime`, `@CreatedAt` | Metodo de contexto existe, pero `AuthService.RegisterAsync` no lo llama todavia. |
| `sp_UpdateRefreshToken` | `UpdateRefreshTokenAsync` | `@UserId`, `@RefreshToken`, `@RefreshTokenExpiryTime`, `@UpdatedAt` | Disponible en contexto, sin uso desde `AuthService`. |
| `sp_GetUserByRefreshToken` | `GetUserByRefreshTokenAsync` | `@RefreshToken` | Disponible en contexto, sin uso desde `AuthService`. |
| `sp_EmailExists` | `EmailExistsAsync` | `@Email`, `@Result OUTPUT` | Disponible en contexto, sin uso desde `AuthService`. |

`POST /api/Auth/register` y `POST /api/Auth/refresh` existen, pero el servicio
actual devuelve `null` y registra warning porque esos flujos no estan
implementados.

## Catalogos

| Stored procedure | Endpoint | Parametros enviados | Salida esperada |
| --- | --- | --- | --- |
| `CSP_PMX_Catalogos` | `GET /api/Catalogos/{catalogo}` | `@P_CATALOGO` | Filas con `cValue` y `cText` para `CatalogoItemDto`. |
| `csp_PMX_ProveedoresListarPaginado` | `POST /api/Catalogos/catalogo-proveedores` | `@Filtro`, `@PageNumber`, `@PageSize` | Filas con `cValue`, `cText` y `totalRows`; el servicio calcula `totalPages` y `more`. |

## Pendientes y detalle de captura

| Stored procedure | Endpoint | Parametros enviados | Campos de salida usados |
| --- | --- | --- | --- |
| `CSP_PMX_ObtenerPendientes` | `GET /api/Visualization/pendientes/{equipo}` | `@EQUIPO` | `id_entrada`, `id_bodega`, `bodega`, `id_cliente`, `cliente`, `id_proveedor`, `proveedor`, `fecha_entrada`, `fecha_previo`, `bultos`, `tipo_envio`, `estatus`, `tipo_captura`, `fecha_documento`, `ruta_documento`, `es_openpo`. |
| `CSP_PMX_DetalleEntrada` | `GET /api/Visualization/detalle-entrada/{idEntrada}` | `@ID_ENTRADA` | `id_entrada`, `id_bulto`, `id`, `id_producto`, `oc_compra`, `um`, `pais_origen`, `discrepancia`, `cantidad`, `cantidad_cartones`, `precio_unitario`, `comentarios`, `clasificado`, `series`, `EsOpenPO`, `descripcion_clas`, `MMS`. |
| `CSP_PMX_DetallePOs` | `GET /api/Visualization/detalle-pos/{idEntrada}` | `@ID_ENTRADA` | `po`, `bultos`, `id_producto`, `cantidad`, `descripcion`, `pais_origen`, `um`. |
| `csp_PMX_GetProveedorPrevio` | `GET /api/Visualization/proveedor-previo/{referencia}` | `@referencia` | `idProveedor`, `proveedor`, `estatus`, `msg`. |

`ruta_documento` puede venir con varias URLs separadas por `|`; la API las
divide y extrae el nombre de archivo con `UrlFileServices.ExtracFileNameFromUrl`.

## Validaciones

| Stored procedure | Endpoint | Parametros enviados | Salida esperada |
| --- | --- | --- | --- |
| `CSP_PMX_ValidarClasificacion` | `POST /api/Clasificacion/validar` y `/validar-post` | `@ID_ENTRADA`, `@ID_PRODUCTO` | `clasificacion`, `descripcion`, `is_spum`, `sp_um`, `is_sppo`, `sp_po`, `is_spmms`, `sp_mms`, `sp_cantidades`, `is_rrmms`. |
| `CSP_PMX_ValidarCuarentenas` | `POST /api/Visualization/validar-cuarentenas` | `@ID_ENTRADA`, `@ID_USUARIO` | Varias filas con `EXITO` y `MENSAJE`; la API marca `success` si todas son exitosas. |
| `SP_FEA_ValidarTokenTeamleader_Result` | `POST /api/Protected/valida-token-teamleader` | `@usuario`, `@token` | `Correcto`, `Mensaje`, `UsuarioAprobo`. |
| `csp_PMX_ValidaMarca` | `POST /api/Visualization/validar-marca` | `@Referencia`, `@id_producto`, `@marca_registro` | `Valido`. |
| `csp_PMX_ValidaModelo` | `POST /api/Visualization/validar-modelo` | `@Referencia`, `@id_producto`, `@modelo_registro` | `Valido`. |

## Operaciones de partida y OpenPO

| Stored procedure | Endpoint | Parametros enviados |
| --- | --- | --- |
| `csp_PMX_RegistrarPartida` | `POST /api/Visualization/registrar-partida` | `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms`. |
| `csp_PMX_ActualizarPartida` | `PUT /api/Visualization/actualizar-partida` | `@id`, `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms`. |
| `csp_PMX_EliminarPartida` | `DELETE /api/Visualization/eliminar-partida` | `@id`, `@idbulto`, `@Referencia`, `@id_producto`. |
| `csp_PMX_AgregarOpenPO` | `POST /api/Visualization/agregar-openpo` | `@Referencia`, `@po`, `@packing`. |

Todas estas operaciones esperan al menos una fila con `estatus` y `msg`.

## Cierre y reapertura de previos

| Stored procedure | Endpoint | Parametros enviados | Salida esperada |
| --- | --- | --- | --- |
| `CSP_PMX_ValidarCierrePrevio` | `GET /api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` | `estatus`, `bultos_totales`, `bultos_previo`, `msg`. |
| `csp_PMX_ExistePrevioCerrado` | `GET /api/Visualization/existe-previo-cerrado/{referencia}` | `@referencia` | `estatus`, `msg`. |
| `sp_previo_TL` | `POST /api/Visualization/puede-reabrir-previo` | `@usuario`, `@password`, `@REIMPRESION = 0` | El codigo lee `usuario`; actualmente fuerza `puedeRegenerar = true` si hay fila. |
| `csp_PMX_ReabrirPrevio` | `GET /api/Visualization/reabre-previo/{referencia}` | `@referencia` | Mismo shape que un pendiente (`PendienteDto`). |

`CSP_PMX_ValidarCierrePrevio` toma `@ID_USUARIO` desde el claim
`ClaimTypes.NameIdentifier`; no viene del body ni de la URL.

## Checklist al cambiar un procedure

1. Confirmar nombre, parametros y columnas de salida en SQL Server.
2. Actualizar `AuthDbContext` con parametros tipados y manejo de `DBNull`.
3. Ajustar DTOs en `PrevioMX_Api/DTO`.
4. Revisar `VisualizationService`, `CatalogosService`, `ClasificacionService`
   o `AuthService` segun aplique.
5. Actualizar `PrevioMX_Web/src/services/previo.service.js` si cambia el
   contrato HTTP.
6. Actualizar esta guia y `USO_ENDPOINTS.md`.
