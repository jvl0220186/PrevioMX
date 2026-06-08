# Guia de uso de endpoints

Esta guia describe los endpoints que usa el frontend de PrevioMX. La fuente de
verdad es el codigo en `Controllers/*` y el cliente
`PrevioMX_Web/src/services/previo.service.js`.

## Convenciones

- Base local comun: `https://localhost:5001`
- Base de produccion usada por el frontend si no hay `VITE_API_BASE_URL`:
  `http://192.168.6.185/PrevioMX/Api`
- Salvo `/api/Auth/*`, todos los endpoints requieren:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

El token JWT se obtiene con login y se guarda en `localStorage` en el frontend.

## Autenticacion

### POST `/api/Auth/login`

Autentica al usuario con `CSP_PMX_Login` y genera un JWT.

```json
{
  "usuario": "YROSALES.MTY",
  "password": "password"
}
```

Respuesta exitosa:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-refresh-token",
  "user": {
    "idUsuario": "123",
    "usuario": "YROSALES.MTY",
    "correoElectronico": "usuario@dominio.com",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "TEAMLEADER"
  }
}
```

Notas:

- `401` indica credenciales invalidas.
- `POST /api/Auth/register` y `POST /api/Auth/refresh` existen en el
  controlador, pero `AuthService` todavia los marca como no implementados y
  devuelve `null`.

## Flujo de captura

```text
login -> pendientes por equipo -> detalle de entrada/catalogos/documentos
      -> validar clasificacion/marca/modelo/cuarentenas
      -> registrar, actualizar o eliminar partida
      -> validar cierre previo
      -> reabrir previo si aplica
```

### 1. Pendientes por equipo

`GET /api/Visualization/pendientes/{equipo}`

Usado por el dashboard para listar referencias pendientes del equipo del
usuario. Ejecuta `CSP_PMX_ObtenerPendientes`.

```bash
curl "$API/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

La respuesta tiene forma:

```json
{
  "items": [
    {
      "idEntrada": "12345",
      "cliente": "Cliente",
      "proveedor": "Proveedor",
      "bultos": 10,
      "estatus": "Pendiente",
      "documentos": [
        { "documento": "factura.pdf", "rutaDocumento": "https://..." }
      ],
      "esOpenpo": false
    }
  ]
}
```

### 2. Detalle y POs de una entrada

| Metodo | Ruta | Uso | Stored procedure |
| --- | --- | --- | --- |
| GET | `/api/Visualization/detalle-entrada/{idEntrada}` | Partidas capturadas o esperadas de una referencia | `CSP_PMX_DetalleEntrada` |
| GET | `/api/Visualization/detalle-pos/{idEntrada}` | Detalle de POs para entradas OpenPO | `CSP_PMX_DetallePOs` |
| GET | `/api/Visualization/proveedor-previo/{referencia}` | Proveedor asociado al previo | `csp_PMX_GetProveedorPrevio` |

### 3. Catalogos

| Metodo | Ruta | Body | Uso |
| --- | --- | --- | --- |
| GET | `/api/Catalogos/{catalogo}` | N/A | Catalogos simples; por ejemplo paises y unidades de medida. |
| POST | `/api/Catalogos/catalogo-proveedores` | `{ "filtro": "", "pageNumber": 1, "pageSize": 20 }` | Busqueda paginada de proveedores. |

`GET /api/Catalogos/{catalogo}` ejecuta `CSP_PMX_Catalogos`; el catalogo
paginado ejecuta `csp_PMX_ProveedoresListarPaginado`.

### 4. Validaciones de producto y captura

| Metodo | Ruta | Body o parametros | Stored procedure |
| --- | --- | --- | --- |
| POST | `/api/Clasificacion/validar` | `{ "idEntrada": "12345", "idProducto": "ABC" }` | `CSP_PMX_ValidarClasificacion` |
| POST | `/api/Clasificacion/validar-post` | Mismo body; usado por el formulario de captura | `CSP_PMX_ValidarClasificacion` |
| POST | `/api/Visualization/validar-marca` | `{ "referencia": "12345", "idProducto": "ABC", "marca": "Marca" }` | `csp_PMX_ValidaMarca` |
| POST | `/api/Visualization/validar-modelo` | `{ "referencia": "12345", "idProducto": "ABC", "modelo": "Modelo" }` | `csp_PMX_ValidaModelo` |
| POST | `/api/Visualization/validar-cuarentenas` | `{ "idEntrada": "12345", "idUsuario": "123" }` | `CSP_PMX_ValidarCuarentenas` |
| POST | `/api/Protected/valida-token-teamleader` | `{ "usuario": "lider", "token": "123456" }` | `SP_FEA_ValidarTokenTeamleader_Result` |

`/api/Protected/valida-token-teamleader` puede responder `401` cuando el token
de aprobacion no es correcto; el interceptor del frontend no redirige al login
para esta ruta especifica.

### 5. Registro, actualizacion y eliminacion de partidas

#### POST `/api/Visualization/registrar-partida`

Ejecuta `csp_PMX_RegistrarPartida`.

```json
{
  "idBulto": "1",
  "referencia": "12345",
  "idProveedor": "987",
  "idProducto": "ABC-001",
  "um": "PZA",
  "cantidad": "10",
  "subCantidad": "1",
  "paisOrigen": "MX",
  "comentarios": "Sin observaciones",
  "usuario": "YROSALES.MTY",
  "ocCompra": "PO123",
  "noParteFisico": "ABC-001",
  "mms": "MMS"
}
```

#### PUT `/api/Visualization/actualizar-partida`

Ejecuta `csp_PMX_ActualizarPartida`. Usa el mismo contrato de registro mas
`id` numerico de la partida.

#### DELETE `/api/Visualization/eliminar-partida`

Axios envia el body en la opcion `data` del request.

```json
{
  "id": 10,
  "idBulto": "1",
  "referencia": "12345",
  "idProducto": "ABC-001"
}
```

Los tres endpoints devuelven:

```json
{
  "estatus": true,
  "msg": "Operacion realizada"
}
```

### 6. OpenPO

`POST /api/Visualization/agregar-openpo`

Ejecuta `csp_PMX_AgregarOpenPO`.

```json
{
  "referencia": "12345",
  "po": "PO123",
  "packing": "PACKING-1"
}
```

### 7. Cierre y reapertura de previo

| Metodo | Ruta | Uso | Stored procedure |
| --- | --- | --- | --- |
| GET | `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | Valida si la referencia puede cerrarse. El `idUsuario` se toma del JWT. | `CSP_PMX_ValidarCierrePrevio` |
| GET | `/api/Visualization/existe-previo-cerrado/{referencia}` | Verifica si existe previo cerrado para reabrir. | `csp_PMX_ExistePrevioCerrado` |
| POST | `/api/Visualization/puede-reabrir-previo` | Valida credenciales de usuario autorizado. Body: `{ "usuario": "...", "password": "..." }`. | `sp_previo_TL` |
| GET | `/api/Visualization/reabre-previo/{referencia}` | Reabre y devuelve datos tipo pendiente. | `csp_PMX_ReabrirPrevio` |

`validar-cierre-previo` responde `404` si el procedure no devuelve resultado y
`401` si el token no contiene el identificador de usuario.

## Proxy PDF y OCR

`GET /api/Visualization/pdf-proxy?url={urlCodificada}`

`PdfOcrViewer` usa este endpoint cuando el PDF esta en un origen distinto al de
la SPA. Restricciones verificadas en `VisualizationController`:

- La URL debe ser absoluta y `https`.
- Hosts permitidos: `grupoei.com.mx`, subdominios de `grupoei.com.mx`,
  `aduax.com`, subdominios de `aduax.com` y subdominios `*.amazonaws.com`.
- `403` significa host no permitido.
- `502` significa error o timeout al obtener el PDF remoto.

El frontend adjunta el JWT tambien al proxy si existe token en `localStorage`.

## Errores comunes

| Codigo | Causa probable | Accion |
| --- | --- | --- |
| 400 | Faltan parametros requeridos o body invalido | Revisar nombres de propiedades contra los DTOs en `PrevioMX_Api/DTO`. |
| 401 | Token faltante, expirado, invalido o validacion Team Leader fallida | Renovar login; para Team Leader revisar el token capturado. |
| 403 | Acceso prohibido o host PDF no permitido | Confirmar permisos o dominio del documento. |
| 404 | El procedure no devolvio datos para la referencia/producto | Validar referencia, producto o estado del previo. |
| 500 | Excepcion de API o SQL Server | Revisar logs de API y resultado del stored procedure. |
| 502 | El proxy PDF no pudo descargar el documento externo | Verificar URL, disponibilidad del host remoto y timeout. |

## Swagger

En desarrollo:

1. Abre `https://localhost:5001/swagger`.
2. Ejecuta `POST /api/Auth/login`.
3. Copia `token`.
4. Usa **Authorize** con `Bearer <token>`.
5. Prueba endpoints protegidos.
