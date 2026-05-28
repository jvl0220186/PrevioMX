# Endpoints de visualizacion y captura

Esta guia resume los endpoints de negocio expuestos por
`Controllers/VisualizationController.cs`. Todos requieren JWT porque el
controlador esta marcado con `[Authorize]`.

## Uso comun

Incluye el token emitido por `POST /api/Auth/login` en cada peticion:

```http
Authorization: Bearer {token}
Content-Type: application/json
```

El frontend consume estos endpoints desde `PrevioMX_Web/src/services/previo.service.js`.

## Flujo principal de captura

1. El Dashboard carga pendientes con `GET /api/Visualization/pendientes/{equipo}`.
2. Al abrir un previo, el frontend guarda `captureData` en `localStorage` y navega a
   `/capture/{idEntrada}`.
3. `CaptureView` carga detalle, catalogos de unidades (`1`) y paises (`2`), proveedor y
   partidas registradas.
4. `AddPartidasForm` registra, actualiza o elimina partidas contra los endpoints de este
   controlador.
5. El cierre llama a `GET /api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}`.

## Endpoints

| Metodo | Ruta | Uso | Stored procedure / origen |
| --- | --- | --- | --- |
| GET | `/api/Visualization/pendientes/{equipo}` | Lista previos pendientes por equipo. | `CSP_PMX_ObtenerPendientes` |
| GET | `/api/Visualization/detalle-entrada/{idEntrada}` | Obtiene datos de entrada, bultos, partidas y documento. | `CSP_PMX_DetalleEntrada` |
| GET | `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}` | Valida/cierra el previo. Toma `idUsuario` del claim `NameIdentifier`. | `CSP_PMX_ValidarCierrePrevio` |
| POST | `/api/Visualization/registrar-partida` | Registra una partida para uno o mas bultos desde el frontend. | `csp_PMX_RegistrarPartida` |
| PUT | `/api/Visualization/actualizar-partida` | Actualiza una partida existente. | `csp_PMX_ActualizarPartida` |
| DELETE | `/api/Visualization/eliminar-partida` | Elimina una partida existente. El body viaja en la peticion DELETE. | `csp_PMX_EliminarPartida` |
| GET | `/api/Visualization/detalle-pos/{idEntrada}` | Carga POs y productos cuando el previo es OpenPO. | `CSP_PMX_DetallePOs` |
| POST | `/api/Visualization/agregar-openpo` | Agrega un PO/packing adicional a una referencia OpenPO. | `csp_PMX_AgregarOpenPO` |
| POST | `/api/Visualization/validar-cuarentenas` | Valida cuarentenas por entrada y usuario. | `CSP_PMX_ValidarCuarentenas` |
| POST | `/api/Visualization/validar-marca` | Valida la marca capturada para una referencia/producto. | `csp_PMX_ValidaMarca` |
| POST | `/api/Visualization/validar-modelo` | Valida el modelo capturado para una referencia/producto. | `csp_PMX_ValidaModelo` |
| GET | `/api/Visualization/existe-previo-cerrado/{referencia}` | Verifica si una busqueda corresponde a un previo cerrado. | `csp_PMX_ExistePrevioCerrado` |
| GET | `/api/Visualization/proveedor-previo/{referencia}` | Obtiene proveedor asociado a una referencia. | `csp_PMX_GetProveedorPrevio` |
| POST | `/api/Visualization/puede-reabrir-previo` | Valida credenciales para reabrir previo. | `sp_previo_TL` |
| GET | `/api/Visualization/reabre-previo/{referencia}` | Reabre el previo y devuelve datos para navegar a captura. | `csp_PMX_ReabrirPrevio` |
| GET | `/api/Visualization/pdf-proxy?url={url}` | Descarga PDFs remotos permitidos para evitar problemas CORS. | HTTP proxy |

## Ejemplos de requests

### Registrar partida

```json
{
  "idBulto": "BULTO-1",
  "referencia": "REF123",
  "idProveedor": "PROV1",
  "idProducto": "NP-001",
  "um": "PZA",
  "cantidad": "10",
  "subCantidad": "1",
  "paisOrigen": "MEX",
  "comentarios": "Sin comentarios",
  "usuario": "YROSALES.MTY",
  "ocCompra": "PO123",
  "noParteFisico": "NP-001",
  "mms": ""
}
```

Campos minimos validados por el controlador: `idBulto` e `idProducto`.

### Actualizar partida

```json
{
  "id": 10,
  "idBulto": "BULTO-1",
  "referencia": "REF123",
  "idProveedor": "PROV1",
  "idProducto": "NP-001",
  "um": "PZA",
  "cantidad": "12",
  "subCantidad": "1",
  "paisOrigen": "MEX",
  "comentarios": "Ajuste de cantidad",
  "usuario": "YROSALES.MTY",
  "ocCompra": "PO123",
  "noParteFisico": "NP-001",
  "mms": ""
}
```

Campos minimos validados: `id > 0`, `idBulto` e `idProducto`.

### Eliminar partida

```json
{
  "id": 10,
  "idBulto": "BULTO-1",
  "referencia": "REF123",
  "idProducto": "NP-001"
}
```

Campos minimos validados: `idBulto`, `referencia` e `idProducto`.

### Agregar OpenPO

```json
{
  "referencia": "REF123",
  "po": "PO123",
  "packing": "PKG-1"
}
```

Campos minimos validados: `referencia`, `po` y `packing`.

### Validar marca y modelo

```json
{
  "referencia": "REF123",
  "idProducto": "NP-001",
  "marca": "MARCA"
}
```

```json
{
  "referencia": "REF123",
  "idProducto": "NP-001",
  "modelo": "MODELO"
}
```

### Validar cuarentenas

```json
{
  "idEntrada": "REF123",
  "idUsuario": "YRO"
}
```

## OpenPO y Standard Pack

- `detalle-pos/{idEntrada}` devuelve `items` con `po`, `bultos`, `idProducto`,
  `cantidad`, `descripcion`, `paisOrigen` y `um`.
- `AddPartidasForm` compara los valores del OpenPO contra la respuesta de
  `POST /api/Clasificacion/validar-post`.
- Si hay conflicto entre OpenPO y Standard Pack para unidad o pais, el usuario puede elegir
  el valor a usar. Elegir OpenPO puede requerir validacion con
  `POST /api/Protected/valida-token-teamleader`.
- La validacion de clasificacion puede incluir banderas `isSpum`, `isSppo`, `isSpmms` e
  `isRrmms`; `isRrmms` hace obligatorio el bloque MMS en captura.

## Reapertura de previos

El Dashboard usa este flujo cuando una busqueda no aparece entre pendientes:

1. `GET /api/Visualization/existe-previo-cerrado/{referencia}` confirma si el previo esta cerrado.
2. Si existe, solicita credenciales y llama a `POST /api/Visualization/puede-reabrir-previo`.
3. Si `puedeRegenerar` es `true`, llama a `GET /api/Visualization/reabre-previo/{referencia}`.
4. El resultado se transforma a `captureData`, se guarda en `localStorage` y se navega a
   `/capture/{referencia}`.

## Proxy de PDF

`GET /api/Visualization/pdf-proxy?url={url}` solo acepta URLs HTTPS de:

- `grupoei.com.mx` y subdominios
- `aduax.com` y subdominios
- hosts que terminen en `.amazonaws.com`

El proxy usa timeout de 30 segundos y responde `403` si el host no esta permitido. El
frontend lo activa cuando el PDF pertenece a un origen distinto al de la aplicacion.
