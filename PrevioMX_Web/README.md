# PrevioMX Web

Aplicación React + Vite para operar el flujo de previo: dashboard de referencias pendientes, captura de partidas, validaciones de producto (Standard Pack / MMS), cierre/reapertura y visualización de PDFs con OCR por región.

Guía detallada de captura: [`docs/FLUJO_CAPTURA.md`](docs/FLUJO_CAPTURA.md).

## Stack

- React 18
- Vite 5
- React Router 6
- Axios
- `pdfjs-dist` para render de PDF
- `tesseract.js` para OCR en idioma `spa`

## Estructura

```text
PrevioMX_Web/
|-- src/
|   |-- components/
|   |   |-- auth/
|   |   |-- capture/
|   |   |-- common/
|   |   `-- dashboard/
|   |-- config/
|   |-- contexts/
|   |-- routes/
|   |-- services/
|   `-- views/
|-- docs/
|-- public/
|-- vite.config.js
`-- package.json
```

## Configuración local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar la URL de API (opcional):

   ```bash
   VITE_API_BASE_URL=https://localhost:5001
   ```

   Si no se define, `src/config/api.config.js` usa:

   - Desarrollo: `https://localhost:5001`
   - Producción (fallback de código): `http://192.168.6.185/PrevioMX/Api`

   El archivo `.env.production` del repo apunta a `https://preproduccion.grupoei.com.mx/PrevioMXApi`.

   > No agregues `/api` al final: los servicios ya incluyen `/api/...` en cada ruta.

   `vite.config.js` también define un proxy de desarrollo `/api` → `process.env.VITE_API_BASE_URL || 'http://localhost:5001'`. El cliente Axios usa `API_CONFIG.BASE_URL` (absoluto) y no depende de ese proxy salvo que apuntes requests al origen de Vite.

3. Levantar Vite:

   ```bash
   npm run dev
   ```

   URL local: `http://localhost:5173` (puerto por defecto de Vite; no hay `server.port` override).

4. Levantar la API .NET en paralelo:

   ```bash
   dotnet run --project ../PrevioMX_Api/PrevioMX_Api.csproj --launch-profile https
   ```

   CORS permite `http://localhost:5173` según `Program.cs`.

## Build

```bash
npm run build
```

`vite.config.js` publica con `base: '/PrevioMX/'`. Durante `closeBundle`, copia `pdf.worker.min.mjs` a `dist/` para IIS.

## Autenticación y sesión

- Login: `POST /api/Auth/login`.
- Se guardan `token` y `user` en `localStorage`.
- `api.service.js` agrega `Authorization: Bearer {token}` y valida `exp` antes de cada request.
- Si el token expira o llega un 401/403 (salvo Team Leader), limpia `token`, `user` y `captureData`, y redirige al login.
- `auth.service.js` expone helpers de `register` / `refresh`, pero en la API `AuthService.RegisterAsync` / `RefreshTokenAsync` siguen devolviendo `null` (`409` / `401`). El login de UI solo usa `login`.

## Rutas principales

| Ruta | Vista | Propósito |
| --- | --- | --- |
| `/` | `LoginView` | Autenticación inicial |
| `/dashboard` | `DashboardView` | Pendientes, filtros, reapertura |
| `/capture/:reference` | `CaptureView` | Captura, OpenPO, MMS, cierre, PDF/OCR |

## Flujo de dashboard

1. Lee `user.equipo` desde `localStorage`.
2. Llama `GET /api/Visualization/pendientes/{equipo}`.
3. Al seleccionar una referencia, guarda `captureData` y navega a captura.

### Reapertura

Cuando la búsqueda deja la tabla vacía:

1. `GET /api/Visualization/existe-previo-cerrado/{referencia}`
2. Modal de credenciales -> `POST /api/Visualization/puede-reabrir-previo`
3. Si `puedeRegenerar === true` -> `GET /api/Visualization/reabre-previo/{referencia}`
4. Guarda `captureData` y navega a captura.

Las credenciales se validan con `sp_previo_TL` (no asumir igualdad con el login).

## Flujo de captura

Al entrar a `/capture/:reference`:

1. Recupera `captureData`.
2. Carga `detalle-entrada`, catálogos `1`/`2` y `proveedor-previo`.
3. Si `esOpenPO`, carga `detalle-pos`.
4. Operaciones:
   - Crear: `POST /api/Visualization/registrar-partida`
   - Editar: `PUT /api/Visualization/actualizar-partida`
   - Eliminar: `DELETE /api/Visualization/eliminar-partida`
   - Agregar OpenPO: `POST /api/Visualization/agregar-openpo`
5. Valida producto con `POST /api/Clasificacion/validar-post`.

### Standard Pack y MMS

- Los inputs Marca/Modelo/Serie están en el formulario; `isSpmms` / `isRrmms` activan badges, alertas y la regla de obligatoriedad.
- `isRrmms`: exige que el número de series capturadas coincida con la cantidad; sin ella, MMS no bloquea el guardado.
- Formato enviado: `marca|modelo|serie~marca2|modelo2|serie2`.
- Conflictos OpenPO vs Standard Pack pueden requerir token Team Leader (`POST /api/Protected/valida-token-teamleader`).

Detalle completo en [`docs/FLUJO_CAPTURA.md`](docs/FLUJO_CAPTURA.md).

## Cierre de previo

Tras confirmar la verificación de desgloses:

```text
GET /api/Visualization/validar-cierre-previo/{reference}/{discrepancia}/{aplicaNom144}
```

El usuario se toma del JWT en backend. Si `estatus` es true, vuelve al dashboard.

## PDF y OCR

`PdfOcrViewer` permite paginar, zoom y OCR por región. Rotar y abrir en nueva pestaña se controlan desde `CaptureView` (`toolbarExtra`).

Cross-origin usa:

```text
GET /api/Visualization/pdf-proxy?url={urlCodificada}
```

Hosts permitidos: `grupoei.com.mx`, `aduax.com`, `.amazonaws.com` y subdominios.

### Pitfalls

- Si el PDF falla en producción, verifica `dist/pdf.worker.min.mjs` y base `/PrevioMX/`.
- `pdf-proxy` 403: host no permitido.
- OCR vacío: aumenta zoom o amplía la región.
- `getClasificacion()` en `previo.service.js` usa un GET inexistente; el flujo activo es `validarPost()`.

## Servicios

- `auth.service.js`: login/logout.
- `api.service.js`: Axios, JWT, redirección y excepción Team Leader.
- `previo.service.js`: catálogos, pendientes, captura, OpenPO, marca/modelo, cierre y reapertura.

## Comandos

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
