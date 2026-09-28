# Stored procedures invocados

Este archivo lista **solo** los SPs que aparecen en `AuthDbContext`. No hay scripts de creación en el repo; las definiciones viven en SQL Server (`Aduasis` en el connection string de desarrollo).

No usar los SPs de plantilla (`sp_GetUserByEmail`, `sp_RegisterUser`, tabla `Users` de autenticación). Esos no forman el login real.

## Autenticación (activo)

| SP | Parámetros | Uso |
|---|---|---|
| `CSP_PMX_Login` | `@P_USUARIO`, `@P_PASSWORD` | Único login. Mapea a `LoginResultDto`. |

## Autenticación (código muerto)

Presentes en `AuthDbContext`, **no** llamados por `AuthService`:

| SP | Método C# |
|---|---|
| `sp_RegisterUser` | `RegisterUserAsync` |
| `sp_UpdateRefreshToken` | `UpdateRefreshTokenAsync` |
| `sp_GetUserByRefreshToken` | `GetUserByRefreshTokenAsync` |
| `sp_EmailExists` | `EmailExistsAsync` (`@Result` OUTPUT) |

## Catálogos

| SP | Parámetros | Resultado |
|---|---|---|
| `CSP_PMX_Catalogos` | `@P_CATALOGO` | `c_value`, `c_text` |
| `csp_PMX_ProveedoresListarPaginado` | `@Filtro`, `@PageNumber`, `@PageSize` | mismos campos + `TotalRows` |

## Visualización y captura

| SP | Parámetros / columnas relevantes |
|---|---|
| `CSP_PMX_ObtenerPendientes` | `@EQUIPO`. `ruta_documento` (URLs unidas por `\|`), `es_openpo`. |
| `CSP_PMX_DetalleEntrada` | `@ID_ENTRADA`. Incluye `EsOpenPO`, `MMS`. |
| `CSP_PMX_DetallePOs` | `@ID_ENTRADA`. `po`, `bultos`, `id_producto`, `cantidad`, `descripcion`, `pais_origen`, `um`. |
| `CSP_PMX_ValidarCierrePrevio` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` → `estatus`, `bultos_totales`, `bultos_previo`, `msg`. |
| `CSP_PMX_ValidarClasificacion` | `@ID_ENTRADA`, `@ID_PRODUCTO` → clasificación + flags Standard Pack / MMS (`is_spum`, `sp_um`, `is_sppo`, `sp_po`, `is_spmms`, `sp_mms`, `sp_cantidades`, `is_rrmms`). `sp_cantidades` lo consume la UI como lista separada por comas. |
| `csp_PMX_RegistrarPartida` | bulto, referencia, proveedor, producto, UM, cantidades, país, comentarios, usuario, OC, no. parte físico, `mms`. → `estatus`, `msg`. |
| `csp_PMX_ActualizarPartida` | igual + `@id`. |
| `csp_PMX_EliminarPartida` | `@id`, `@idbulto`, `@Referencia`, `@id_producto`. |
| `csp_PMX_AgregarOpenPO` | `@Referencia`, `@po`, `@packing`. |
| `CSP_PMX_ValidarCuarentenas` | `@ID_ENTRADA`, `@ID_USUARIO` → filas `EXITO`, `MENSAJE`. `Success` = todas `Exito`. |
| `csp_PMX_ValidaMarca` | `@Referencia`, `@id_producto`, `@marca_registro` → `Valido`. |
| `csp_PMX_ValidaModelo` | `@Referencia`, `@id_producto`, `@modelo_registro` → `Valido`. |
| `csp_PMX_ExistePrevioCerrado` | `@referencia` → `estatus`, `msg`. |
| `csp_PMX_GetProveedorPrevio` | `@referencia` → `idProveedor`, `proveedor`, `estatus`, `msg`. |
| `csp_PMX_ReabrirPrevio` | `@referencia`. Misma forma de fila que pendientes. |

## Permisos / tokens

| SP | Parámetros | Notas de mapeo |
|---|---|---|
| `sp_previo_TL` | `@usuario`, `@password`, `@REIMPRESION` (API envía `0`) | Si hay fila: `usuario` del reader; `PuedeRegenerar` se **fija a true**; `LUsuario` se **fija a ""**. Sin fila el método retorna `null` (el controller lo convierte en 500). |
| `SP_FEA_ValidarTokenTeamleader_Result` | `@usuario`, `@token` | `Correcto`, `Mensaje`, `UsuarioAprobo`. |

## Constraints

- Los nombres de columnas los lee el `SqlDataReader` tal cual (`id_entrada`, `EsOpenPO`, `EXITO`, etc.). Un rename en el SP rompe el mapeo.
- `ruta_documento` es una cadena concatenada con `|`. Cada segmento se convierte en `{ documento, rutaDocumento }` vía `UrlFileServices.ExtracFileNameFromUrl` (`new Uri` + `Path.GetFileName`). Una URL relativa o malformada lanza y tumba todo el `GetPendientes`.
- No hay migraciones EF de estos SPs. EF solo mapea un `DbSet<User>` mínimo para SPs muertos de registro.
- Varios métodos abren y cierran la conexión ADO a mano (`GetDbConnection`). Un SP que no cierra el reader bloquea el pool.
