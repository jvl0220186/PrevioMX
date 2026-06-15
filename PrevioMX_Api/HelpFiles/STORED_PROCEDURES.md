# Stored procedures usados por PrevioMX API

La API usa Entity Framework Core como capa de conexion a SQL Server, pero el
comportamiento de negocio vive principalmente en stored procedures. El punto de
entrada esta en `Business/AuthDbContext.cs`; ahi se construyen los parametros y
se mapean los resultsets a DTOs.

> Esta pagina documenta los procedimientos invocados por el codigo actual. No
> incluye scripts de creacion porque las firmas reales viven en la base de datos
> `Aduasis`.

## Inventario por flujo

| Flujo | Metodo C# | Stored procedure | Parametros enviados desde la API |
| --- | --- | --- | --- |
| Login | `LoginAsync` | `CSP_PMX_Login` | `@P_USUARIO`, `@P_PASSWORD` |
| Catalogos generales | `GetCatalogosAsync` | `CSP_PMX_Catalogos` | `@P_CATALOGO` |
| Proveedores paginados | `GetCatalogoProveedoresPaginadoAsync` | `csp_PMX_ProveedoresListarPaginado` | `@Filtro`, `@PageNumber`, `@PageSize` |
| Dashboard pendientes | `GetPendientesAsync` | `CSP_PMX_ObtenerPendientes` | `@EQUIPO` |
| Detalle de entrada | `GetDetalleEntradaAsync` | `CSP_PMX_DetalleEntrada` | `@ID_ENTRADA` |
| Cierre de previo | `GetValidarCierrePrevioAsync` | `CSP_PMX_ValidarCierrePrevio` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` |
| Clasificacion | `GetValidarClasificacionAsync` | `CSP_PMX_ValidarClasificacion` | `@ID_ENTRADA`, `@ID_PRODUCTO` |
| Registrar partida | `RegistrarPartidaAsync` | `csp_PMX_RegistrarPartida` | `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms` |
| Detalle OpenPO | `GetDetallePOsAsync` | `CSP_PMX_DetallePOs` | `@ID_ENTRADA` |
| Actualizar partida | `ActualizarPartidaAsync` | `csp_PMX_ActualizarPartida` | `@id`, `@idbulto`, `@Referencia`, `@id_proveedor`, `@id_producto`, `@UM`, `@cantidad`, `@sub_cantidad`, `@pais_origen`, `@Comentarios`, `@Usuario`, `@oc_compra`, `@noparte_fisico`, `@mms` |
| Cuarentenas | `ValidarCuarentenasAsync` | `CSP_PMX_ValidarCuarentenas` | `@ID_ENTRADA`, `@ID_USUARIO` |
| Token Team Leader | `ValidarTokenTeamleaderAsync` | `SP_FEA_ValidarTokenTeamleader_Result` | `@usuario`, `@token` |
| Marca | `ValidarMarcaAsync` | `csp_PMX_ValidaMarca` | `@Referencia`, `@id_producto`, `@marca_registro` |
| Modelo | `ValidarModeloAsync` | `csp_PMX_ValidaModelo` | `@Referencia`, `@id_producto`, `@modelo_registro` |
| Eliminar partida | `EliminarPartidaAsync` | `csp_PMX_EliminarPartida` | `@id`, `@idbulto`, `@Referencia`, `@id_producto` |
| Agregar OpenPO | `AgregarOpenPOAsync` | `csp_PMX_AgregarOpenPO` | `@Referencia`, `@po`, `@packing` |
| Existe previo cerrado | `GetExistePrevioCerradoAsync` | `csp_PMX_ExistePrevioCerrado` | `@referencia` |
| Proveedor del previo | `GetProveedorPrevioAsync` | `csp_PMX_GetProveedorPrevio` | `@referencia` |
| Permiso reapertura | `PuedeReabrirPrevio` | `sp_previo_TL` | `@usuario`, `@password`, `@REIMPRESION = 0` |
| Reabrir previo | `ReabrePrevio` | `csp_PMX_ReabrirPrevio` | `@referencia` |

## Resultsets esperados por la API

Los nombres de columnas importan porque el codigo lee por nombre desde
`DbDataReader`.

### Pendientes y reapertura

`CSP_PMX_ObtenerPendientes` y `csp_PMX_ReabrirPrevio` deben devolver columnas
como:

- `id_entrada`, `id_bodega`, `bodega`
- `id_cliente`, `cliente`
- `id_proveedor`, `proveedor`
- `fecha_entrada`, `fecha_previo`, `fecha_documento`
- `bultos`, `tipo_envio`, `estatus`, `tipo_captura`
- `ruta_documento`: URLs separadas por `|`
- `es_openpo`

La API transforma `ruta_documento` en una lista de documentos usando
`UrlFileServices.ExtracFileNameFromUrl`.

### Detalle de entrada

`CSP_PMX_DetalleEntrada` alimenta la pantalla de captura. Columnas leidas:

- `id_entrada`, `id_bulto`, `id`, `id_producto`
- `oc_compra`, `um`, `pais_origen`
- `discrepancia`, `cantidad`, `cantidad_cartones`, `precio_unitario`
- `comentarios`, `clasificado`, `series`, `EsOpenPO`
- `descripcion_clas`, `MMS`

### Respuestas de operaciones de partida

`csp_PMX_RegistrarPartida`, `csp_PMX_ActualizarPartida`,
`csp_PMX_EliminarPartida`, `csp_PMX_AgregarOpenPO` y
`csp_PMX_ExistePrevioCerrado` se mapean a:

```json
{
  "estatus": true,
  "msg": "Operacion realizada"
}
```

### Validaciones

- `CSP_PMX_ValidarCierrePrevio`: `estatus`, `bultos_totales`,
  `bultos_previo`, `msg`.
- `CSP_PMX_ValidarClasificacion`: `clasificacion`, `descripcion`, `is_spum`,
  `sp_um`, `is_sppo`, `sp_po`, `is_spmms`, `sp_mms`, `sp_cantidades`,
  `is_rrmms`.
- `CSP_PMX_ValidarCuarentenas`: filas con `EXITO` y `MENSAJE`; la API marca
  `success` si todas las filas tienen `EXITO = true`.
- `SP_FEA_ValidarTokenTeamleader_Result`: `Correcto`, `Mensaje`,
  `UsuarioAprobo`.
- `csp_PMX_ValidaMarca` y `csp_PMX_ValidaModelo`: `Valido`.
- `csp_PMX_GetProveedorPrevio`: `idProveedor`, `proveedor`, `estatus`, `msg`.
- `sp_previo_TL`: al devolver una fila, la API responde
  `puedeRegenerar = true`.

## Procedimientos heredados en el contexto

`AuthDbContext` conserva metodos para `sp_RegisterUser`,
`sp_UpdateRefreshToken`, `sp_GetUserByRefreshToken` y `sp_EmailExists`, pero
`AuthService.RegisterAsync` y `AuthService.RefreshTokenAsync` no los usan y
devuelven `null`. No deben considerarse parte del flujo soportado hasta que se
implemente registro/refresh en la capa de negocio.

## Permisos requeridos

El usuario configurado en `ConnectionStrings:DefaultConnection` necesita:

- permiso `EXECUTE` sobre los procedimientos listados;
- permiso de lectura de metadatos/resultsets que usen los procedimientos;
- acceso a la base de datos configurada para el ambiente.

Ejemplo de validacion:

```sql
SELECT name
FROM sys.procedures
WHERE name IN (
  'CSP_PMX_Login',
  'CSP_PMX_ObtenerPendientes',
  'CSP_PMX_DetalleEntrada',
  'csp_PMX_RegistrarPartida',
  'CSP_PMX_ValidarCierrePrevio'
)
ORDER BY name;
```

## Troubleshooting

- Si un endpoint responde `500` con errores de columnas inexistentes, comparar
  el resultset del SP contra la seccion "Resultsets esperados".
- Si una validacion responde `404`, revisar si el SP no devolvio filas para los
  parametros enviados.
- Si `pendientes` trae documentos vacios, revisar que `ruta_documento` venga
  separado por `|` y con URLs completas.
- Si la reapertura navega sin datos suficientes, validar el resultset de
  `csp_PMX_ReabrirPrevio`, que debe parecerse a un item de pendientes.

