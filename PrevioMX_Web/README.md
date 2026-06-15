# PrevioMX Web

SPA React + Vite para operar el flujo de previos contra `PrevioMX_Api`.

## Capacidades principales

- Login con JWT y rutas protegidas.
- Dashboard de pendientes por equipo.
- Captura de partidas por referencia.
- Validaciones de clasificacion, marca, modelo, cuarentenas y cierre.
- Reapertura de previos cerrados con credenciales especiales.
- Visor PDF con proxy CORS y OCR por seleccion de area.

## Estructura

```text
PrevioMX_Web/
├── src/
│   ├── components/
│   │   ├── auth/              # LoginForm
│   │   ├── capture/           # AddPartidasForm, PdfOcrViewer
│   │   ├── common/            # dropdowns, toast, loading
│   │   ├── dashboard/         # tabla y KPIs
│   │   └── layout/            # Header
│   ├── config/api.config.js   # URL base del API
│   ├── contexts/              # AuthContext/AuthProvider
│   ├── routes/AppRoutes.jsx   # rutas publicas/protegidas
│   ├── services/              # Axios y servicios de dominio
│   └── views/                 # Login, Dashboard, Capture
├── package.json
└── vite.config.js
```

## Instalacion y desarrollo

```bash
npm install
npm run dev
```

Vite usa `http://localhost:5173` por defecto. `Program.cs` de la API permite ese
origen en la politica CORS `AllowFrontend`.

Variables utiles:

| Variable | Uso | Default si no existe |
| --- | --- | --- |
| `VITE_API_BASE_URL` | URL base usada por Axios. Debe apuntar al root del API, sin duplicar `/api` si las rutas del servicio ya lo incluyen. | Dev: `https://localhost:5001`; prod: `http://192.168.6.185/PrevioMX/Api` |
| `VITE_DEV_MODE` | Si vale `true`, `AuthProvider` crea un usuario mock y omite login real. | `false` |

Ejemplo `.env.development`:

```bash
VITE_API_BASE_URL=https://localhost:5001
VITE_DEV_MODE=false
```

## Build y publicacion

```bash
npm run build
npm run preview
```

`vite.config.js` define:

- `base: '/PrevioMX/'`, por lo que el build espera publicarse bajo ese subpath.
- Proxy dev para `/api` hacia `VITE_API_BASE_URL` o `http://localhost:5001`.
- Plugin `copyPdfWorker` que copia
  `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` a `dist/pdf.worker.min.mjs`.

Si se publica bajo otra ruta, ajustar `base` y verificar que el worker de PDF se
sirva desde `{base}/pdf.worker.min.mjs`.

## Rutas de aplicacion

| Ruta | Acceso | Vista | Proposito |
| --- | --- | --- | --- |
| `/` | Publica | `LoginView` | Login con `usuario` y `password`. |
| `/login` | Publica | redirect a `/` | Alias de login. |
| `/dashboard` | Protegida | `DashboardView` | Pendientes, filtros, KPIs y reapertura. |
| `/capture/:reference` | Protegida | `CaptureView` | Captura, documentos, partidas y cierre. |

`ProtectedRoute` redirige a `/` si no hay usuario autenticado. `PublicRoute`
redirige a `/dashboard` si ya existe sesion.

## Autenticacion y almacenamiento local

`auth.service.js` llama `POST /api/Auth/login` con:

```json
{
  "usuario": "YROSALES.MTY",
  "password": "123"
}
```

En una respuesta exitosa guarda:

- `localStorage.token`: JWT.
- `localStorage.user`: objeto con `idUsuario`, `usuario`, `correoElectronico`,
  `equipo`, `grupoId`, `lider`.

`api.service.js` agrega `Authorization: Bearer {token}` en cada request,
decodifica `exp` para detectar expiracion y, ante `401/403`, limpia `token`,
`user` y `captureData` antes de redirigir al login. La unica excepcion es
`/api/Protected/valida-token-teamleader`, donde un `401` se devuelve al
formulario para mostrar el mensaje.

`register` y `refreshToken` existen en el servicio frontend, pero la API no los
implementa actualmente; no los uses como flujo principal.

## Flujo Dashboard -> Captura

1. `DashboardView` lee `localStorage.user.equipo`.
2. Consulta `GET /api/Visualization/pendientes/{equipo}`.
3. Mapea cada item a la tabla de referencias y documentos.
4. Al abrir una referencia, `DashboardTable` guarda `captureData` en
   `localStorage` y navega a `/capture/:reference`.
5. `CaptureView` valida que `captureData.reference` coincida con la ruta.

`captureData` esperado:

```json
{
  "reference": "ENTRADA-123",
  "idCliente": "CLI-1",
  "client": "Cliente",
  "idProveedor": "PROV-1",
  "provider": "Proveedor",
  "date": "15 jun 2026",
  "bundles": 10,
  "status": "Documento Listo",
  "documentos": [
    {
      "documento": "factura.pdf",
      "rutaDocumento": "https://vuc.grupoei.com.mx/..."
    }
  ]
}
```

### Reapertura de previo

Cuando la busqueda del dashboard no devuelve resultados, la vista valida
`GET /api/Visualization/existe-previo-cerrado/{referencia}`. Si `estatus` es
`true`, muestra el boton **Reabrir previo**:

1. El usuario captura credenciales especiales.
2. Se llama `POST /api/Visualization/puede-reabrir-previo`.
3. Si `puedeRegenerar` es `true`, se llama
   `GET /api/Visualization/reabre-previo/{referencia}`.
4. La respuesta se transforma a `captureData` y se navega a captura.

## Flujo de captura

`CaptureView` carga en paralelo:

- `GET /api/Visualization/detalle-entrada/{reference}`
- `GET /api/Catalogos/1` para unidades
- `GET /api/Catalogos/2` para paises

Luego consulta `GET /api/Visualization/proveedor-previo/{reference}` como
fuente preferente para proveedor. Si el detalle indica `esOpenPO`, tambien llama
`GET /api/Visualization/detalle-pos/{reference}`.

KPIs calculados en cliente:

- `totalBultos`: `count(distinct idBulto)`
- `capturados`: bultos con `idProducto` no vacio
- `pendientes`: `totalBultos - capturados`
- `lineasProductos`: partidas con producto no vacio

Operaciones sobre partidas:

- Crear: `POST /api/Visualization/registrar-partida`
- Editar: `PUT /api/Visualization/actualizar-partida`
- Eliminar: `DELETE /api/Visualization/eliminar-partida`
- Agregar OpenPO: `POST /api/Visualization/agregar-openpo`

Antes de guardar, `AddPartidasForm` puede validar:

- clasificacion: `POST /api/Clasificacion/validar-post`
- marca: `POST /api/Visualization/validar-marca`
- modelo: `POST /api/Visualization/validar-modelo`
- token Team Leader: `POST /api/Protected/valida-token-teamleader`

### Cierre de previo

El boton de cierre depende de las validaciones de pantalla y del check de
desgloses. El modal envia:

```text
GET /api/Visualization/validar-cierre-previo/{reference}/{discrepancia}/{aplicaNom144}
```

Si la API responde `estatus: true`, la web muestra confirmacion y vuelve al
dashboard. Si responde `false`, muestra `msg` y permanece en captura.

## Visor PDF y OCR

`PdfOcrViewer` usa:

- `pdfjs-dist` para renderizar PDFs.
- `tesseract.js` para OCR del area seleccionada.
- `pdf-proxy` de la API cuando la URL del PDF tiene otro origen.

Reglas importantes:

- En dev, el worker se carga desde `pdfjs-dist/build/pdf.worker.min.mjs`.
- En produccion, el worker se carga desde `{BASE_URL}/pdf.worker.min.mjs`.
- Si el PDF es cross-origin, se llama
  `/api/Visualization/pdf-proxy?url={url}` con el mismo Bearer token.
- La API solo acepta URLs HTTPS de hosts permitidos (`grupoei.com.mx`,
  `aduax.com` y subdominios `.amazonaws.com`).

## Troubleshooting

- **La app redirige al login:** revisar `localStorage.token`, expiracion `exp`
  y que la API use el mismo `JwtSettings:SecretKey`.
- **404/401 al llamar API:** confirmar que `VITE_API_BASE_URL` no duplique
  `/api`; los servicios ya construyen rutas como `/api/Visualization/...`.
- **PDF no carga en produccion:** verificar `base: '/PrevioMX/'`, existencia de
  `dist/pdf.worker.min.mjs` y que el host del PDF este permitido por el proxy.
- **Reapertura no aparece:** solo se muestra cuando la busqueda no tiene
  resultados y `existe-previo-cerrado` devuelve `estatus: true`.
- **OCR devuelve texto pobre:** aumentar zoom, seleccionar un area mas chica y
  revisar que el PDF se renderice sin rotacion inesperada.

