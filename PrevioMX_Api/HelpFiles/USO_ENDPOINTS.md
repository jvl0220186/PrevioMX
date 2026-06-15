# Guia de uso de endpoints

Esta guia resume los endpoints implementados en `PrevioMX_Api/Controllers`.
Salvo `AuthController`, todos los controladores usan `[Authorize]` y requieren
un JWT Bearer valido.

## Autenticacion

### POST `/api/Auth/login`

Inicia sesion contra el stored procedure `CSP_PMX_Login` y devuelve un JWT.

**Request**

```json
{
  "usuario": "YROSALES.MTY",
  "password": "123"
}
```

**Response 200**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-generado-en-memoria",
  "user": {
    "idUsuario": "YRO",
    "usuario": "yrosales.mty",
    "correoElectronico": "yrosales.mty@grupoei.com.mx",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "yrosales.mty"
  }
}
```

`POST /api/Auth/register` y `POST /api/Auth/refresh` existen en el controlador,
pero `AuthService` aun no los implementa y devuelve `null`. El flujo soportado
para renovar sesion es volver a ejecutar login.

## Header requerido

```http
Authorization: Bearer {token}
Content-Type: application/json
```

Ejemplo:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

## Visualization

Controlador: `VisualizationController`. Servicio: `VisualizationService`.
Acceso a datos: `AuthDbContext`.

| Metodo | Ruta | Uso | Stored procedure principal |
| --- | --- | --- | --- |
| GET | `/api/Visualization/pendientes/{equipo}` | Lista referencias pendientes para el equipo del usuario. | `CSP_PMX_ObtenerPendientes` |
| GET | `/api/Visualization/detalle-entrada/{idEntrada}` | Detalle de bultos/partidas de una referencia. | `CSP_PMX_DetalleEntrada` |
| GET | `/api/Visualization/detalle-pos/{idEntrada}` | Productos asociados a entradas OpenPO. | `CSP_PMX_DetallePOs` |
| POST | `/api/Visualization/registrar-partida` | Crea una partida capturada. | `csp_PMX_RegistrarPartida` |
| PUT | `/api/Visualization/actualizar-partida` | Actualiza una partida existente. | `csp_PMX_ActualizarPartida` |
| DELETE | `/api/Visualization/eliminar-partida` | Elimina una partida por `id`, bulto, referencia y producto. | `csp_PMX_EliminarPartida` |
| POST | `/api/Visualization/agregar-openpo` | Agrega PO/packing a una referencia OpenPO. | `csp_PMX_AgregarOpenPO` |
| GET | `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | Valida y cierra previo usando el usuario del token. | `CSP_PMX_ValidarCierrePrevio` |
| POST | `/api/Visualization/validar-cuarentenas` | Valida cuarentenas por entrada y usuario. | `CSP_PMX_ValidarCuarentenas` |
| POST | `/api/Visualization/validar-marca` | Valida marca capturada para referencia/producto. | `csp_PMX_ValidaMarca` |
| POST | `/api/Visualization/validar-modelo` | Valida modelo capturado para referencia/producto. | `csp_PMX_ValidaModelo` |
| GET | `/api/Visualization/existe-previo-cerrado/{referencia}` | Comprueba si una referencia cerrada puede mostrarse para reapertura. | `csp_PMX_ExistePrevioCerrado` |
| POST | `/api/Visualization/puede-reabrir-previo` | Valida credenciales especiales para reabrir previo. | `sp_previo_TL` |
| GET | `/api/Visualization/reabre-previo/{referencia}` | Reabre el previo y devuelve datos para navegar a captura. | `csp_PMX_ReabrirPrevio` |
| GET | `/api/Visualization/proveedor-previo/{referencia}` | Obtiene proveedor actual asociado a una referencia. | `csp_PMX_GetProveedorPrevio` |
| GET | `/api/Visualization/pdf-proxy?url={url}` | Descarga PDFs externos permitidos para evitar CORS en la web. | HTTP externo, sin SP |

### Ejemplos de requests de captura

Registrar partida:

```json
{
  "idBulto": "BULTO-1",
  "referencia": "ENTRADA-123",
  "idProveedor": "PROV-1",
  "idProducto": "ABC-123",
  "um": "PZA",
  "cantidad": "10",
  "subCantidad": "1",
  "paisOrigen": "MEX",
  "comentarios": "Capturado en previo",
  "usuario": "yrosales.mty",
  "ocCompra": "PO-123",
  "noParteFisico": "ABC-123",
  "mms": "MMS-1"
}
```

Cerrar previo:

```bash
curl "https://localhost:5001/api/Visualization/validar-cierre-previo/ENTRADA-123/false/true" \
  -H "Authorization: Bearer $TOKEN"
```

La API toma `idUsuario` desde el claim `ClaimTypes.NameIdentifier`; no debe
enviarse manualmente en la URL.

## Catalogos

Controlador: `CatalogosController`.

| Metodo | Ruta | Uso | Stored procedure |
| --- | --- | --- | --- |
| GET | `/api/Catalogos/{catalogo}` | Devuelve items de catalogo por ID. La web usa `1` para unidades y `2` para paises. | `CSP_PMX_Catalogos` |
| POST | `/api/Catalogos/catalogo-proveedores` | Busca proveedores con filtro y paginacion. | `csp_PMX_ProveedoresListarPaginado` |

Ejemplo de proveedores:

```json
{
  "filtro": "acme",
  "pageNumber": 1,
  "pageSize": 20
}
```

## Clasificacion

Controlador: `ClasificacionController`.

| Metodo | Ruta | Uso | Stored procedure |
| --- | --- | --- | --- |
| POST | `/api/Clasificacion/validar` | Valida clasificacion por entrada/producto. | `CSP_PMX_ValidarClasificacion` |
| POST | `/api/Clasificacion/validar-post` | Variante POST usada por el formulario de captura. | `CSP_PMX_ValidarClasificacion` |

```json
{
  "idEntrada": "ENTRADA-123",
  "idProducto": "ABC-123"
}
```

La respuesta puede incluir clasificacion, descripcion y campos de Standard Pack
(`isSpum`, `spUm`, `isSppo`, `spPo`, `isSpmms`, `spMms`, `spCantidades`,
`isRrmms`).

## Protected

| Metodo | Ruta | Uso | Stored procedure |
| --- | --- | --- | --- |
| GET | `/api/Protected/test` | Endpoint de diagnostico JWT. Devuelve claims basicos. | N/A |
| POST | `/api/Protected/valida-token-teamleader` | Valida token de Team Leader para operaciones especiales de captura. | `SP_FEA_ValidarTokenTeamleader_Result` |

Request:

```json
{
  "usuario": "yrosales.mty",
  "token": "123456"
}
```

Si el stored procedure responde `correcto: true`, la API devuelve `200` con
`usuarioAprobo`; de lo contrario responde `401`.

## Proxy PDF

`GET /api/Visualization/pdf-proxy?url={url}` solo acepta URLs HTTPS. Los hosts
permitidos por codigo son:

- `grupoei.com.mx` y subdominios
- `aduax.com` y subdominios
- subdominios que terminen en `.amazonaws.com`

El endpoint requiere JWT como cualquier otro endpoint de `Visualization`. El
frontend lo usa automaticamente cuando el PDF esta en un origen distinto al de
la app.

## Errores comunes

- `401 Unauthorized`: falta el header `Authorization`, el token esta expirado o
  la firma no coincide con `JwtSettings:SecretKey`.
- `403 Forbidden` en `pdf-proxy`: la URL no es HTTPS o el host no esta en la
  lista permitida.
- `404` en validaciones: el stored procedure no devolvio datos para los
  parametros enviados.
- `500`: error en API o stored procedure; revisar logs de .NET y SQL Server.

## Swagger UI

1. Abre Swagger en el ambiente de API, por ejemplo `https://localhost:5001/swagger`.
2. Ejecuta `POST /api/Auth/login`.
3. Copia el campo `token`.
4. Usa **Authorize** con el formato `Bearer {token}`.
5. Prueba los endpoints protegidos.

