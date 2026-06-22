# Guia de uso de endpoints

Esta guia resume los endpoints reales expuestos por la API .NET de PrevioMX y como los consume el frontend React. La informacion fue verificada contra `Controllers/*`, `Business/AuthDbContext.cs` y `PrevioMX_Web/src/services/previo.service.js`.

## Base URL y autenticacion

- Desarrollo API: `https://localhost:5001` o `http://localhost:5000` segun `Properties/launchSettings.json`.
- Desarrollo web: Vite corre en `http://localhost:5173`.
- Produccion web: `vite.config.js` publica con base `/PrevioMX/`.
- Todos los controladores de negocio usan JWT salvo `AuthController`, que esta marcado con `[AllowAnonymous]`.

Header requerido para endpoints protegidos:

```http
Authorization: Bearer {token}
```

> Importante: el `refreshToken` que devuelve login no se envia en `Authorization`. El frontend actual tampoco renueva sesion automaticamente; si el JWT expira, `api.service.js` limpia `localStorage` y redirige al login.

## Autenticacion

### POST `/api/Auth/login`

Valida credenciales con `CSP_PMX_Login` y genera un JWT.

```bash
curl -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "USUARIO.MTY",
    "password": "password"
  }'
```

Respuesta esperada:

```json
{
  "token": "eyJ...",
  "refreshToken": "token_de_refresh",
  "user": {
    "idUsuario": "YRO",
    "usuario": "usuario.mty",
    "correoElectronico": "usuario@grupoei.com.mx",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "lider.mty"
  }
}
```

### POST `/api/Auth/register` y POST `/api/Auth/refresh`

Las rutas existen en `AuthController`, pero `AuthService.RegisterAsync` y `AuthService.RefreshTokenAsync` aun devuelven `null` porque esperan stored procedures. En la practica:

- `register` responde `409 Conflict`.
- `refresh` responde `401 Unauthorized`.
- No deben documentarse como flujo disponible para usuarios hasta que se implemente la logica.

## Dashboard de pendientes

### GET `/api/Visualization/pendientes/{equipo}`

Devuelve las referencias pendientes por equipo. El dashboard toma `user.equipo` desde `localStorage` y llama este endpoint al cargar.

```bash
TOKEN="eyJ..."

curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta abreviada:

```json
{
  "items": [
    {
      "idEntrada": "REF123",
      "idCliente": "C001",
      "cliente": "Cliente",
      "idProveedor": "P001",
      "proveedor": "Proveedor",
      "fechaEntrada": "2026-06-22T00:00:00",
      "bultos": 3,
      "estatus": "Documento Listo",
      "tipoCaptura": "Manual",
      "documentos": [
        {
          "documento": "packing.pdf",
          "rutaDocumento": "https://vuc.grupoei.com.mx/vucem/files/packing.pdf"
        }
      ],
      "esOpenpo": false
    }
  ]
}
```

Notas:

- `documentos` se arma a partir de `ruta_documento` separado por `|`.
- El frontend guarda el item seleccionado en `localStorage.captureData` antes de navegar a `/capture/{reference}`.

## Captura de previo

### GET `/api/Visualization/detalle-entrada/{idEntrada}`

Carga bultos y partidas ya capturadas. `CaptureView` calcula KPIs con estos datos:

- Total bultos: `count(distinct idBulto)`.
- Capturados: bultos con `idProducto` no vacio.
- Pendientes: total menos capturados.
- Lineas de productos: registros con `idProducto` no vacio.

### POST `/api/Visualization/registrar-partida`

Registra una partida con `csp_PMX_RegistrarPartida`.

```json
{
  "idBulto": "B1",
  "referencia": "REF123",
  "idProveedor": "P001",
  "idProducto": "SKU-001",
  "um": "PZA",
  "cantidad": "10",
  "subCantidad": "1",
  "paisOrigen": "MEX",
  "comentarios": "Sin observaciones",
  "usuario": "USUARIO.MTY",
  "ocCompra": "PO123",
  "noParteFisico": "SKU-001",
  "mms": ""
}
```

Respuesta comun de operaciones de partida:

```json
{
  "estatus": true,
  "msg": "Operacion realizada"
}
```

### PUT `/api/Visualization/actualizar-partida`

Actualiza una partida con `csp_PMX_ActualizarPartida`. Requiere `id > 0`, `idBulto` e `idProducto`.

### DELETE `/api/Visualization/eliminar-partida`

Elimina una partida con `csp_PMX_EliminarPartida`.

```json
{
  "id": 10,
  "idBulto": "B1",
  "referencia": "REF123",
  "idProducto": "SKU-001"
}
```

### GET `/api/Visualization/detalle-pos/{idEntrada}`

Solo se consulta cuando `detalle-entrada` indica `esOpenPO = true`. Devuelve POs y productos relacionados para guiar la captura.

### POST `/api/Visualization/agregar-openpo`

Agrega un Open PO a una referencia con `csp_PMX_AgregarOpenPO`.

```json
{
  "referencia": "REF123",
  "po": "PO123",
  "packing": "PACKING-01"
}
```

## Validaciones de producto

### GET `/api/Clasificacion/{idEntrada}/{idProducto}`

Consulta clasificacion de producto con `CSP_PMX_ValidarClasificacion`.

### POST `/api/Clasificacion/validar-post`

Valida clasificacion y datos de Standard Pack por `idEntrada` e `idProducto`.

### POST `/api/Visualization/validar-marca`

Valida marca capturada contra `csp_PMX_ValidaMarca`.

```json
{
  "referencia": "REF123",
  "idProducto": "SKU-001",
  "marca": "MARCA"
}
```

### POST `/api/Visualization/validar-modelo`

Valida modelo capturado contra `csp_PMX_ValidaModelo`.

```json
{
  "referencia": "REF123",
  "idProducto": "SKU-001",
  "modelo": "MODELO"
}
```

## Cierre de previo

### GET `/api/Visualization/validar-cierre-previo/{idEntrada}/{discrepancia}/{aplicaNom144}`

Valida y cierra el previo mediante `CSP_PMX_ValidarCierrePrevio`. El `idUsuario` se toma del claim `ClaimTypes.NameIdentifier` del JWT; no se envia en la URL.

```bash
curl -X GET "https://localhost:5001/api/Visualization/validar-cierre-previo/REF123/false/true" \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta:

```json
{
  "estatus": true,
  "bultosTotales": 3,
  "bultosPrevio": 3,
  "msg": "Previo cerrado"
}
```

## Reapertura de previo

El dashboard solo muestra "Reabrir previo" cuando la busqueda no tiene resultados y el backend confirma que existe un previo cerrado.

1. `GET /api/Visualization/existe-previo-cerrado/{referencia}`
2. `POST /api/Visualization/puede-reabrir-previo`
3. `GET /api/Visualization/reabre-previo/{referencia}`

`puede-reabrir-previo` valida credenciales especiales con `sp_previo_TL`; no son necesariamente las mismas del login principal.

```json
{
  "usuario": "TEAMLEADER",
  "password": "password"
}
```

Si puede reabrir, `reabre-previo` devuelve un `PendienteDto`, el frontend lo guarda como `captureData` y navega a captura.

## PDF y OCR

### GET `/api/Visualization/pdf-proxy?url={url}`

Proxy protegido para PDFs externos usado por `PdfOcrViewer` cuando el documento no esta en el mismo origen del frontend.

Restricciones verificadas:

- Solo acepta URLs `https`.
- Hosts permitidos: `grupoei.com.mx`, subdominios de `grupoei.com.mx`, `aduax.com`, subdominios de `aduax.com` y hosts que terminen en `.amazonaws.com`.
- Timeout HTTP: 30 segundos.
- Errores remotos o timeout responden `502`.

El frontend carga el PDF con `pdfjs-dist`, usa el worker `pdf.worker.min.mjs` copiado durante el build, y ejecuta OCR por region con `tesseract.js` en idioma `spa`.

## Catalogos

### GET `/api/Catalogos/{catalogoId}`

Usado para unidades (`1`) y paises (`2`) en captura.

### POST `/api/Catalogos/catalogo-proveedores`

Busca proveedores paginados para el modal de cambio de proveedor.

```json
{
  "filtro": "texto",
  "pageNumber": 0,
  "pageSize": 20
}
```

El frontend no permite cambiar proveedor si ya existen partidas capturadas.
