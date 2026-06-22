# PrevioMX Web

Aplicacion React + Vite para operar el flujo de previo: dashboard de referencias pendientes, captura de partidas, validaciones de producto, cierre/reapertura de previo y visualizacion de PDFs con OCR por region.

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
|-- public/
|-- vite.config.js
`-- package.json
```

## Configuracion local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar la URL de API si no usas el default:

   ```bash
   VITE_API_BASE_URL=https://localhost:5001
   ```

   Si no se define, `src/config/api.config.js` usa:

   - Desarrollo: `https://localhost:5001`
   - Produccion: `http://192.168.6.185/PrevioMX/Api`

3. Levantar Vite:

   ```bash
   npm run dev
   ```

   URL local: `http://localhost:5173`.

4. Levantar la API .NET en paralelo:

   ```bash
   dotnet run --project ../PrevioMX_Api/PrevioMX_Api.csproj --launch-profile https
   ```

   La API debe permitir CORS desde `http://localhost:5173` segun `Program.cs`.

## Build

```bash
npm run build
```

`vite.config.js` publica con `base: '/PrevioMX/'`. Durante `closeBundle`, copia `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` a `dist/pdf.worker.min.mjs` para que `PdfOcrViewer` pueda cargar el worker en IIS con la ruta `{BASE_URL}pdf.worker.min.mjs`.

## Autenticacion y sesion

- Login: `POST /api/Auth/login`.
- El token y el usuario se guardan en `localStorage` como `token` y `user`.
- `src/services/api.service.js` agrega `Authorization: Bearer {token}` a cada request.
- Antes de enviar requests, el interceptor decodifica el JWT y valida `exp`.
- Si el token expira o llega un 401/403, se eliminan `token`, `user` y `captureData`, y se redirige al login.
- `POST /api/Auth/register` y `POST /api/Auth/refresh` existen en la API, pero el servicio backend aun no los implementa como flujos funcionales.

## Rutas principales

| Ruta | Vista | Proposito |
| --- | --- | --- |
| `/` | `LoginView` | Autenticacion inicial |
| `/dashboard` | `DashboardView` | Pendientes por equipo, filtros, reapertura de previo |
| `/capture/:reference` | `CaptureView` | Captura, edicion, eliminacion, OpenPO, cierre y PDF/OCR |

## Flujo de dashboard

1. Lee `user.equipo` desde `localStorage`.
2. Llama `previoService.getPendientes(equipo)` -> `GET /api/Visualization/pendientes/{equipo}`.
3. Mapea cada pendiente a la tabla y guarda documentos disponibles.
4. Al seleccionar una referencia, guarda el item en `localStorage.captureData` y navega a captura.

### Reapertura de previo

Cuando la busqueda deja la tabla sin resultados:

1. Espera 400 ms y llama `GET /api/Visualization/existe-previo-cerrado/{referencia}`.
2. Si `estatus === true`, muestra el boton **Reabrir previo**.
3. El modal pide credenciales especiales y llama `POST /api/Visualization/puede-reabrir-previo`.
4. Si `puedeRegenerar === true`, llama `GET /api/Visualization/reabre-previo/{referencia}`.
5. Guarda el resultado como `captureData` y navega a `/capture/{referencia}`.

Las credenciales de reapertura se validan con el SP `sp_previo_TL` y no deben asumirse iguales al login principal.

## Flujo de captura

Al entrar a `/capture/:reference`:

1. Recupera datos base desde `localStorage.captureData`.
2. Carga en paralelo:
   - `GET /api/Visualization/detalle-entrada/{reference}`
   - `GET /api/Catalogos/1` para unidades
   - `GET /api/Catalogos/2` para paises
3. Consulta `GET /api/Visualization/proveedor-previo/{reference}` y usa ese proveedor si existe.
4. Calcula KPIs:
   - Total bultos: distintos `idBulto`.
   - Capturados: bultos con `idProducto`.
   - Pendientes: total menos capturados.
   - Lineas de productos: items con `idProducto`.
5. Si `detalle-entrada` indica `esOpenPO`, consulta `GET /api/Visualization/detalle-pos/{reference}`.

Operaciones de partidas:

- Crear: `POST /api/Visualization/registrar-partida`.
- Editar: `PUT /api/Visualization/actualizar-partida`.
- Eliminar: `DELETE /api/Visualization/eliminar-partida`.
- Agregar OpenPO: `POST /api/Visualization/agregar-openpo`.

El proveedor puede cambiarse solo mientras no haya partidas capturadas.

## Cierre de previo

El boton **Cerrar Previo** se habilita al marcar "He verificado los desgloses de bultos y cantidades totales del previo".

Al confirmar, la vista llama:

```text
GET /api/Visualization/validar-cierre-previo/{reference}/{discrepancia}/{aplicaNom144}
```

`discrepancia` y `aplicaNom144` salen del modal. El usuario se toma del JWT en backend.

Si `response.estatus` es `true`, la vista muestra exito y navega al dashboard. Si es `false`, muestra `response.msg` y permanece en captura.

## PDF y OCR

`PdfOcrViewer` renderiza el documento seleccionado y permite:

- Paginar PDFs.
- Zoom entre 50% y 300%.
- Rotar desde `CaptureView`.
- Abrir el PDF en nueva pestaña.
- Ir al expediente externo.
- Seleccionar una region del canvas para OCR con `tesseract.js`.

### Proxy de PDF

Cuando la URL del PDF es cross-origin, `PdfOcrViewer` usa:

```text
GET /api/Visualization/pdf-proxy?url={urlCodificada}
```

El request incluye el JWT. El backend solo permite URLs HTTPS de:

- `grupoei.com.mx` y subdominios.
- `aduax.com` y subdominios.
- hosts `.amazonaws.com`.

### Pitfalls frecuentes

- Si el PDF falla en produccion, verifica que `dist/pdf.worker.min.mjs` exista y que la app se sirva bajo `/PrevioMX/`.
- Si `pdf-proxy` devuelve 403, revisa el host del PDF.
- Si OCR devuelve texto vacio, valida que la region seleccionada tenga suficiente resolucion; aumentar zoom puede ayudar.
- Si el request del proxy devuelve 401, el JWT pudo expirar y el interceptor redirigira al login.

## Servicios de API

- `auth.service.js`: login, logout, helpers de usuario/token. Incluye metodos `register` y `refreshToken`, pero el backend aun no completa esos flujos.
- `api.service.js`: instancia Axios, expiracion JWT, redireccion a login y manejo especial de validacion Team Leader.
- `previo.service.js`: catálogos, pendientes, captura, OpenPO, marca/modelo, cierre, reapertura y proxy indirecto via `PdfOcrViewer`.

## Comandos

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
