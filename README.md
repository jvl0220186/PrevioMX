# PrevioMX

Monorepo de captura de previos: API .NET 8 (`PrevioMX_Api`) y SPA React/Vite (`PrevioMX_Web`).

## Arquitectura

```
Navegador (/PrevioMX)  →  API (/api/*)  →  SQL Server (stored procedures CSP_PMX_*)
         JWT Bearer              AuthDbContext
```

- **Web**: login, dashboard de pendientes por equipo y captura de partidas (MMS, OpenPO, cierre/reapertura, PDF/OCR).
- **API**: JWT + EF Core contra SQL Server. La lógica de negocio vive en stored procedures; la API mapea resultados.
- **Auth**: `POST /api/Auth/login` llama `CSP_PMX_Login`. `register` y `refresh` existen en el controlador pero **no están implementados** (409 / 401).

## Setup local

### API

1. .NET 8 SDK.
2. DLLs externas referenciadas fuera del repo (el build falla si no existen):
   - `..\..\..\DLL\onecore.security.encryptvr.dll`
   - `..\..\..\Apostol\Dev\ApostolWeb\ApostolWeb\onecore.security.services.dll`
3. Cadena `ConnectionStrings:DefaultConnection` en `PrevioMX_Api/appsettings.json` (SQL Server). No commitear contraseñas en docs.
4. `appsettings.json` está marcado como `EmbeddedResource` y se copia al output.
5. Perfil `https` en `launchSettings.json`: `https://localhost:5001` y `http://localhost:5000`. Swagger solo en `Development`.

```bash
cd PrevioMX_Api
dotnet run --launch-profile https
```

`Program.cs` llama `UseHttpsRedirection()`. Si el front apunta a `http://localhost:5000`, el navegador puede recibir un 307 hacia HTTPS.

### Web

```bash
cd PrevioMX_Web
npm install
# .env.development ya define VITE_API_BASE_URL=https://localhost:5001
npm run dev
```

Vite sirve en `http://localhost:5173`. El router usa `basename="/PrevioMX"`, así que la app queda en `http://localhost:5173/PrevioMX/`.

Axios usa `API_CONFIG.BASE_URL` (absoluta). El proxy `/api` de Vite **no** se usa salvo que el cliente apunte a rutas relativas. `vite.config.js` no llama `loadEnv`; el proxy solo lee `process.env.VITE_API_BASE_URL` del shell.

CORS en `Program.cs` permite únicamente `http://localhost:5173`, `:3000` y `:5000`. Un origen de preproducción no pasará CORS contra una API local.

## Variables de entorno (web)

| Variable | Uso |
|---|---|
| `VITE_API_BASE_URL` | Base de Axios. Sin env: `https://localhost:5001` en dev; `http://192.168.6.185/PrevioMX/Api` en build. |
| `VITE_DEV_MODE=true` | Usuario mock **sin JWT**. Las llamadas protegidas fallan con 401. |
| `VITE_AB3_URL` | Presente en `.env*`; **no se usa** en `src/`. |

Producción (`.env.production`): `https://preproduccion.grupoei.com.mx/PrevioMXApi`.

## Mapa de documentación

| Doc | Contenido |
|---|---|
| [PrevioMX_Api/HelpFiles/README.md](PrevioMX_Api/HelpFiles/README.md) | Índice de la API |
| [PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md](PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md) | Superficie HTTP real |
| [PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md](PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md) | Login, claims, expiración |
| [PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md](PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md) | SPs invocados por código |
| [PrevioMX_Api/HelpFiles/CONFIGURACION_BD.md](PrevioMX_Api/HelpFiles/CONFIGURACION_BD.md) | SQL Server y EF |
| [PrevioMX_Api/HelpFiles/RUNBOOK.md](PrevioMX_Api/HelpFiles/RUNBOOK.md) | Troubleshooting y trampas operativas |
| [PrevioMX_Web/README.md](PrevioMX_Web/README.md) | Setup y trampas del frontend |
| [PrevioMX_Web/docs/FLUJO_CAPTURA.md](PrevioMX_Web/docs/FLUJO_CAPTURA.md) | Dashboard → captura, MMS, OpenPO, cierre |

## Hallazgos operativos (verificados)

- `POST /api/Visualization/validar-cuarentenas` no tiene cliente en el frontend.
- OpenPO: la API exige `packing`; la UI solo valida `po` antes de llamar.
- `CatalogosService.More` asume página 1-based; `ProveedoresCombo` empieza en `0` → con una sola página `More` permanece `true`.
- Un `403` de `pdf-proxy` (host no permitido) lo trata `api.service.js` como sesión expirada y redirige al login. El `401` de `valida-token-teamleader` **no** cierra sesión.
- `GET /api/Clasificacion/{entrada}/{producto}` no existe; `getClasificacion()` está muerto. El flujo activo es `POST /api/Clasificacion/validar-post`.
- `sp_previo_TL`: si hay fila, el mapeo fuerza `PuedeRegenerar=true` y `LUsuario=""`.
- `GET /WeatherForecast` es un leftover de plantilla (`[Authorize]`); no forma parte del flujo de negocio.
- Login activo: `LoginView.jsx` (`type="text"`, etiqueta “Usuario / Correo”). `LoginForm.jsx` (`type="email"`) **no se importa**.
- Interceptor: timeout/red (`ECONNABORTED` / `ERR_NETWORK`) también limpia sesión si el JWT ya venció.
- IIS: `public/web.config` mapea `.mjs` y reescribe SPA a `index.html`.
