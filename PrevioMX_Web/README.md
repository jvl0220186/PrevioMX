# PrevioMX Web

SPA React 18 + Vite 5. Consume la API .NET (`PrevioMX_Api`).

## Rutas (`basename="/PrevioMX"`)

| Ruta | Vista | Guard |
|---|---|---|
| `/` | `LoginView` | pública; si hay sesión → `/dashboard` |
| `/login` | redirect a `/` | — |
| `/dashboard` | Pendientes del equipo | JWT / `VITE_DEV_MODE` |
| `/capture/:reference` | Captura de partidas | JWT / `VITE_DEV_MODE` |
| `*` | redirect a `/dashboard` | — |

URL de desarrollo: `http://localhost:5173/PrevioMX/` (no el puerto 3000).

`LoginForm.jsx` (`type="email"`) **no se importa**. El login real es `LoginView.jsx`.

## Setup

```bash
npm install
npm run dev
```

`.env.development`:

```
VITE_API_BASE_URL=https://localhost:5001
VITE_DEV_MODE=false
```

`.env.production` (build): `https://preproduccion.grupoei.com.mx/PrevioMXApi`.

Sin `VITE_API_BASE_URL`: dev → `https://localhost:5001`; prod → `http://192.168.6.185/PrevioMX/Api`.

`VITE_AB3_URL` está en `.env*` y **no se referencia** en `src/`.

`API_CONFIG.RETRY_ATTEMPTS` / `RETRY_DELAY` tampoco se usan.

## Auth

1. `LoginView` envía el campo “Usuario / Correo” (`type="text"`) a `POST /api/Auth/login` como `{ usuario, password }`.
2. Guarda `token` y `user` en `localStorage`.
3. Interceptor: si `exp` ya pasó, limpia sesión **antes** de llamar.
4. 401/403 → logout y redirect a `/PrevioMX/`, **excepto** `POST /api/Protected/valida-token-teamleader`.
5. Timeout/red (`ECONNABORTED`, `ERR_NETWORK`) también limpian sesión si el JWT no existe o ya venció.
6. `register` / `refresh` existen en `auth.service.js` pero la API no los implementa.

`VITE_DEV_MODE=true` crea un usuario mock (`id: dev-user`) **sin JWT**. Sirve para pintar UI; las llamadas `[Authorize]` fallan.

Flujo de captura, MMS, OpenPO, cierre y reapertura: [docs/FLUJO_CAPTURA.md](docs/FLUJO_CAPTURA.md). Runbook de síntomas: [../PrevioMX_Api/HelpFiles/RUNBOOK.md](../PrevioMX_Api/HelpFiles/RUNBOOK.md).

## Servicios

| Archivo | Rol |
|---|---|
| `src/config/api.config.js` | `BASE_URL`, timeout 30s |
| `src/services/api.service.js` | Axios + interceptores |
| `src/services/auth.service.js` | login / storage |
| `src/services/previo.service.js` | catálogos, visualización, clasificación, TL |

`getClasificacion()` llama un GET que **no existe**. El formulario usa `validarPost()`.

No hay cliente para `validar-cuarentenas`.

## Vite / PDF / IIS

- `base: '/PrevioMX/'`.
- Plugin `copyPdfWorker` copia `pdf.worker.min.mjs` a `dist/` (producción / IIS).
- En dev, PDF.js carga el worker desde `node_modules`.
- Proxy `/api` → `process.env.VITE_API_BASE_URL || http://localhost:5001`. Axios **no** usa ese proxy (URL absoluta). `loadEnv` no se llama.

El visor pide PDFs vía `GET {BASE_URL}/api/Visualization/pdf-proxy?url=`. Hosts permitidos: grupoei, aduax, `*.amazonaws.com`. Un 403 del proxy dispara logout.

`public/web.config` (IIS):

- MIME `.mjs` → `application/javascript` (sin esto el worker PDF falla).
- Rewrite SPA: si no es archivo/carpeta → `index.html`.

## Build

```bash
npm run build
npm run preview
```

El artefacto espera hospedarse bajo `/PrevioMX/`. `pdf.worker.min.mjs` debe quedar en la raíz del publish junto al `index.html`.

## Trampas

- CORS de la API solo acepta localhost. Front en otro origen + API local = error de navegador.
- Certificado `https://localhost:5001`: el navegador debe confiarlo o las llamadas fallan.
- Catálogo proveedores: la UI pagina desde `0`; el API default y `More` asumen 1-based.
- OpenPO: enviar `packing` aunque el form no lo valide.
- `api.service.js` trata casi cualquier 403 como sesión expirada.
- Multibulto: un `POST registrar-partida` por bulto seleccionado; un fallo parcial no revierte los éxitos.
