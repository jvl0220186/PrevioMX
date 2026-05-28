# Stored procedures usados por la API

La API de PrevioMX accede a SQL Server principalmente mediante stored procedures desde
`Business/AuthDbContext.cs`. Este documento lista las llamadas verificadas en codigo; no
incluye scripts de creacion porque la definicion interna de cada procedure vive en la base
de datos.

## Autenticacion

| Metodo en codigo | Stored procedure | Estado |
| --- | --- | --- |
| `LoginAsync` | `CSP_PMX_Login @P_USUARIO, @P_PASSWORD` | Usado por `POST /api/Auth/login`. |
| `RegisterUserAsync` | `sp_RegisterUser ...` | Metodo disponible en el DbContext, pero `AuthService.RegisterAsync` no lo llama. |
| `UpdateRefreshTokenAsync` | `sp_UpdateRefreshToken ...` | Metodo disponible en el DbContext, pero refresh no esta implementado en `AuthService`. |
| `GetUserByRefreshTokenAsync` | `sp_GetUserByRefreshToken @RefreshToken` | Metodo disponible en el DbContext, pero refresh no esta implementado. |
| `EmailExistsAsync` | `sp_EmailExists @Email, @Result OUTPUT` | Metodo disponible en el DbContext, no usado por el flujo actual. |

> Importante: `POST /api/Auth/register` y `POST /api/Auth/refresh` existen en
> `AuthController`, pero actualmente devuelven error porque `AuthService` retorna `null`.

## Catalogos y clasificacion

| Endpoint | Stored procedure | Parametros desde API |
| --- | --- | --- |
| `GET /api/Catalogos/{catalogo}` | `CSP_PMX_Catalogos` | `@P_CATALOGO` |
| `POST /api/Catalogos/catalogo-proveedores` | `csp_PMX_ProveedoresListarPaginado` | `@Filtro`, `@PageNumber`, `@PageSize` |
| `POST /api/Clasificacion/validar` | `CSP_PMX_ValidarClasificacion` | `@ID_ENTRADA`, `@ID_PRODUCTO` |
| `POST /api/Clasificacion/validar-post` | `CSP_PMX_ValidarClasificacion` | `@ID_ENTRADA`, `@ID_PRODUCTO` |

`ValidarClasificacionResponse` puede devolver Standard Pack:

- `clasificacion`, `descripcion`
- `is_spum`, `sp_um`
- `is_sppo`, `sp_po`
- `is_spmms`, `sp_mms`, `sp_cantidades`
- `is_rrmms`

## Visualizacion y captura

| Endpoint | Stored procedure | Parametros principales |
| --- | --- | --- |
| `GET /api/Visualization/pendientes/{equipo}` | `CSP_PMX_ObtenerPendientes` | `@EQUIPO` |
| `GET /api/Visualization/detalle-entrada/{idEntrada}` | `CSP_PMX_DetalleEntrada` | `@ID_ENTRADA` |
| `GET /api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | `CSP_PMX_ValidarCierrePrevio` | `@ID_ENTRADA`, `@ID_USUARIO`, `@DISCREPANCIA`, `@APLICA_NOM144` |
| `POST /api/Visualization/registrar-partida` | `csp_PMX_RegistrarPartida` | Partida completa (`idBulto`, `referencia`, `idProducto`, etc.) |
| `PUT /api/Visualization/actualizar-partida` | `csp_PMX_ActualizarPartida` | `id` y partida completa |
| `DELETE /api/Visualization/eliminar-partida` | `csp_PMX_EliminarPartida` | `id`, `idBulto`, `referencia`, `idProducto` |
| `GET /api/Visualization/detalle-pos/{idEntrada}` | `CSP_PMX_DetallePOs` | `@ID_ENTRADA` |
| `POST /api/Visualization/agregar-openpo` | `csp_PMX_AgregarOpenPO` | `referencia`, `po`, `packing` |
| `POST /api/Visualization/validar-cuarentenas` | `CSP_PMX_ValidarCuarentenas` | `@ID_ENTRADA`, `@ID_USUARIO` |
| `POST /api/Visualization/validar-marca` | `csp_PMX_ValidaMarca` | `@Referencia`, `@id_producto`, `@marca_registro` |
| `POST /api/Visualization/validar-modelo` | `csp_PMX_ValidaModelo` | `@Referencia`, `@id_producto`, `@modelo_registro` |
| `GET /api/Visualization/existe-previo-cerrado/{referencia}` | `csp_PMX_ExistePrevioCerrado` | `@referencia` |
| `GET /api/Visualization/proveedor-previo/{referencia}` | `csp_PMX_GetProveedorPrevio` | `@referencia` |
| `POST /api/Visualization/puede-reabrir-previo` | `sp_previo_TL` | `@usuario`, `@password`, `@REIMPRESION` |
| `GET /api/Visualization/reabre-previo/{referencia}` | `csp_PMX_ReabrirPrevio` | `@referencia` |

`GET /api/Visualization/pdf-proxy` no usa stored procedure; descarga un PDF remoto con
validacion de host y timeout de 30 segundos.

## Protegidos

| Endpoint | Stored procedure | Parametros |
| --- | --- | --- |
| `POST /api/Protected/valida-token-teamleader` | `SP_FEA_ValidarTokenTeamleader_Result` | `@usuario`, `@token` |

Este endpoint responde `200` cuando `correcto` es `true`; si el procedure devuelve
`correcto: false`, el controlador responde `401` y conserva el mensaje para el frontend.

## Consideraciones para cambios futuros

- Si se agrega un endpoint nuevo, documentar aqui el procedure y los parametros reales.
- Si se implementa register/refresh, actualizar tambien `AUTENTICACION_JWT.md` y el
  frontend `auth.service.js`.
- No asumir que los nombres de columnas SQL coinciden con camelCase de JSON: varios DTOs
  usan `[Column("nombre_sql")]` y ASP.NET serializa las propiedades del DTO.
