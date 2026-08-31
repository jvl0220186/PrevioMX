# PrevioMX Web

SPA React 18 + Vite 5. Habla con PrevioMX API por Axios. Base de rutas: `/PrevioMX`.

## Intento

- Login JWT y dashboard de pendientes por `user.equipo`.
- Captura de partidas (clasificación, Standard Pack, MMS, OpenPO).
- Visualización OCR de PDFs de documentos del pendiente.

## Estructura

```
PrevioMX_Web/
├── src/
│   ├── components/     # auth, capture, dashboard, layout, common
│   ├── config/         # api.config.js (BASE_URL)
│   ├── contexts/       # AuthProvider / AuthContext
│   ├── routes/         # AppRoutes.jsx
│   ├── services/       # api.service.js, auth.service.js, previo.service.js
│   ├── views/          # Login, Dashboard, Capture
│   └── App.jsx         # BrowserRouter basename="/PrevioMX"
├── docs/FLUJO_CAPTURA.md
├── vite.config.js      # base: '/PrevioMX/', copia pdf.worker.min.mjs
└── .env.development / .env.production
```

## Rutas

| Path | Guard | Vista |
|------|-------|-------|
| `/` | público; si hay sesión → dashboard | Login |
| `/login` | redirect a `/` | — |
| `/dashboard` | JWT / user | Pendientes |
| `/capture/:reference` | JWT / user | Captura |
| `*` | → `/dashboard` | — |

URL local: `http://localhost:5173/PrevioMX/`.

## Setup

```bash
npm install
npm run dev      # Vite, puerto 5173
npm run build    # sale a dist/; copia pdf.worker.min.mjs
npm run preview
```

### Variables

| Variable | Desarrollo (repo) | Producción (repo) | Efecto |
|----------|-------------------|-------------------|--------|
| `VITE_API_BASE_URL` | `https://localhost:5001` | `https://preproduccion.grupoei.com.mx/PrevioMXApi` | Base de Axios (**absoluta**) |
| `VITE_DEV_MODE` | `false` | — | Si `true`, `AuthProvider` mockea user **sin JWT** |
| `VITE_AB3_URL` | definida | definida | **No se lee** en `src/` |

Si no hay env: desarrollo → `https://localhost:5001`; otro → `http://192.168.6.185/PrevioMX/Api` (`api.config.js`).

Vite **no** llama `loadEnv` en `vite.config.js`. El proxy `/api` usa `process.env.VITE_API_BASE_URL` del **shell**, o `http://localhost:5001`. Axios **no** usa ese proxy: pega a `API_CONFIG.BASE_URL`.

## Autenticación (UI)

- Login: `POST /api/Auth/login` con `{ usuario, password }`.
- Guarda `token` y `user` en `localStorage`.
- Interceptor: Bearer + chequeo de `exp`; 401/403 → limpia token/user/`captureData` y manda a `/PrevioMX/` (excepto `valida-token-teamleader`).
- `register` / `refresh` en `auth.service.js` no tienen flujo de UI y la API no los implementa.

## Servicios de negocio

`previo.service.js` cubre catálogos, pendientes, partidas, OpenPO, marca/modelo, cierre y reapertura.

No hay cliente para `POST /api/Visualization/validar-cuarentenas`.

`getClasificacion()` llama un GET que **no existe**. Usar `validarPost()`.

## CORS y PDF

La API solo permite orígenes localhost (5173/3000/5000). Un build servido desde otro host necesita que CORS se amplíe en `Program.cs`.

PDFs cross-origin van a `GET /api/Visualization/pdf-proxy?url=`. Hosts: `*.grupoei.com.mx`, `*.aduax.com`, `*.amazonaws.com`. Un 403 del proxy cierra sesión.

OCR: `pdfjs-dist` + `tesseract.js`. En prod el worker es `{base}pdf.worker.min.mjs` (plugin `copyPdfWorker`).

## Pitfalls

1. Abrir `http://localhost:5173/` sin `/PrevioMX/` rompe el router.
2. `VITE_DEV_MODE=true` “loguea” pero todas las APIs `[Authorize]` fallan.
3. `ProveedoresCombo` pagina desde 0; el API calcula `more` 1-based → puede pedir páginas de más.
4. OpenPO: la UI exige solo `po`; la API exige también `packing`.
5. Certificado HTTPS local: el browser debe confiar en `https://localhost:5001`.
6. `appsettings` embebido y DLLs `onecore.security.*` son problemas de API, no de npm.

Flujo de captura, MMS y reapertura: [docs/FLUJO_CAPTURA.md](docs/FLUJO_CAPTURA.md).
