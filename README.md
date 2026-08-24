# PrevioMX

Monorepo de PrevioMX: API .NET 8 con JWT y SPA React/Vite para visualizar pendientes, capturar partidas de packing list y cerrar previos.

## Arquitectura

```text
PrevioMX_Web (React/Vite)
  -> services/*.js (Axios + JWT)
  -> PrevioMX_Api (ASP.NET Core)
  -> AuthDbContext (EF Core + SQL Server)
  -> stored procedures CSP_PMX_*, csp_PMX_* y SP_FEA_*
```

- La API expone controladores bajo `/api/*` y usa `AuthDbContext` para ejecutar stored procedures.
- El frontend guarda `token`, `user` y `captureData` en `localStorage`; Axios agrega `Authorization: Bearer {token}`.
- Flujo principal: `/dashboard` -> `/capture/:reference`.
- `App.jsx` usa `BrowserRouter basename="/PrevioMX"`; `vite.config.js` publica con `base: '/PrevioMX/'`.

## Prerrequisitos

- .NET SDK 8.
- Node.js compatible con Vite 5.
- SQL Server con los stored procedures esperados por `PrevioMX_Api/Business/AuthDbContext.cs`.
- Acceso a las DLLs externas referenciadas por `PrevioMX_Api/PrevioMX_Api.csproj` (`onecore.security.encryptvr` y `onecore.security.services`). Las `HintPath` apuntan fuera del repo (`..\..\..\DLL` y `..\..\..\Apostol\Dev\...`); sin esas DLLs el `dotnet build` falla.

## Ejecución local

### API

```bash
cd PrevioMX_Api
dotnet run --launch-profile https
```

URLs locales (`Properties/launchSettings.json`):

- HTTPS: `https://localhost:5001`
- HTTP: `http://localhost:5000`
- Swagger solo en `Development`: `/swagger`

`Program.cs` llama `UseHttpsRedirection()`; en local prefiera el perfil `https`.

Configuración requerida:

- `ConnectionStrings:DefaultConnection`
- `JwtSettings:SecretKey`, `Issuer`, `Audience`, `ExpirationMinutes`

`appsettings.json` está marcado como `EmbeddedResource` (no como `Content`). Ajuste de connection string o JWT en el archivo embebido, o sobrescriba con `appsettings.Development.json` / variables de entorno (`ConnectionStrings__DefaultConnection`, `JwtSettings__SecretKey`).

No commitear contraseñas reales de SQL.

### Web

```bash
cd PrevioMX_Web
npm install
npm run dev
```

- Vite: `http://localhost:5173` (puerto por defecto; no hay override de `server.port`).
- `VITE_API_BASE_URL` debe apuntar a la raíz de la API (ej. `https://localhost:5001`), **sin** sufijo `/api`.
- Si no se define, `src/config/api.config.js` usa `https://localhost:5001` en desarrollo y `http://192.168.6.185/PrevioMX/Api` como fallback de producción.
- `.env.production` del repo usa `https://preproduccion.grupoei.com.mx/PrevioMXApi`.
- `vite.config.js` incluye proxy `/api` → `http://localhost:5001` (o `VITE_API_BASE_URL` del **shell**). Axios usa la URL absoluta de `API_CONFIG`; el proxy no carga `.env*` porque no hay `loadEnv`.
- CORS permite solo `http://localhost:5173`, `http://localhost:3000` y `http://localhost:5000`.
- `VITE_DEV_MODE=true` mockea usuario **sin JWT**; dashboard/captura fallan contra la API real.
- `VITE_AB3_URL` aparece en `.env*`, pero no hay referencias en `src/` al momento de esta guía.

## Documentación

| Documento | Contenido |
| --- | --- |
| `PrevioMX_Api/HelpFiles/README.md` | Índice de HelpFiles |
| `PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md` | Endpoints reales de negocio |
| `PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md` | Inventario de SPs usados por la API |
| `PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md` | Emisión, claims y troubleshooting JWT |
| `PrevioMX_Api/HelpFiles/CONFIGURACION_BD.md` | Connection string, permisos y diagnóstico |
| `PrevioMX_Api/HelpFiles/CURL_CORRECTO.md` | Ejemplos cURL de endpoints reales |
| `PrevioMX_Api/HelpFiles/FORMATO_TOKEN.md` | Formato del header Bearer |
| `PrevioMX_Api/HelpFiles/SWAGGER_AUTENTICACION.md` | Autorizar Swagger en Development |
| `PrevioMX_Web/README.md` | Setup frontend, rutas y operación |
| `PrevioMX_Web/docs/FLUJO_CAPTURA.md` | Captura, MMS, OpenPO, Standard Pack y PDF/OCR |

## Operación y despliegue web

- El build copia `pdf.worker.min.mjs` a `dist/` para PDF.js.
- `public/web.config` configura IIS: MIME `.mjs` y rewrite SPA a `index.html`.
- `GET /api/Visualization/pdf-proxy` solo acepta URLs HTTPS de hosts `grupoei.com.mx`, `aduax.com`, `.amazonaws.com` y subdominios.
- Un `403` del proxy (host no permitido) pasa por el interceptor de Axios y, salvo Team Leader, **redirige al login**.
