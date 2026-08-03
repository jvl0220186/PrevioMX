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

## Prerrequisitos

- .NET SDK 8.
- Node.js compatible con Vite 5.
- SQL Server con los stored procedures esperados por `PrevioMX_Api/Business/AuthDbContext.cs`.
- Acceso a las dependencias externas referenciadas por `PrevioMX_Api/PrevioMX_Api.csproj` (por ejemplo `onecore.security.*`).

## Ejecución local

### API

```bash
cd PrevioMX_Api
dotnet run --launch-profile https
```

URLs locales (`Properties/launchSettings.json`):

- HTTPS: `https://localhost:5001`
- HTTP: `http://localhost:5000`
- Swagger en Development: `/swagger`

Configuración requerida:

- `ConnectionStrings:DefaultConnection`
- `JwtSettings:SecretKey`, `Issuer`, `Audience`, `ExpirationMinutes`

### Web

```bash
cd PrevioMX_Web
npm install
npm run dev
```

- Vite: `http://localhost:5173`
- `VITE_API_BASE_URL` debe apuntar a la raíz de la API (ej. `https://localhost:5001`), sin sufijo `/api`.
- Si no se define, `src/config/api.config.js` usa `https://localhost:5001` en desarrollo.
- `vite.config.js` incluye proxy `/api` → `http://localhost:5001` (o `VITE_API_BASE_URL` del shell); el cliente Axios usa la URL absoluta de `API_CONFIG`.
- CORS permite `http://localhost:5173` según `Program.cs`.

## Documentación clave

| Documento | Contenido |
| --- | --- |
| `PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md` | Endpoints reales de negocio |
| `PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md` | Inventario de SPs usados por la API |
| `PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md` | Emisión, claims y troubleshooting JWT |
| `PrevioMX_Web/README.md` | Setup frontend, rutas y operación |
| `PrevioMX_Web/docs/FLUJO_CAPTURA.md` | Captura, MMS, OpenPO, Standard Pack y PDF/OCR |

## Operación y despliegue web

- `vite.config.js` define `base: '/PrevioMX/'`.
- El build copia `pdf.worker.min.mjs` a `dist/` para PDF.js.
- `public/web.config` configura IIS (MIME `.mjs` y rewrite SPA).
- `GET /api/Visualization/pdf-proxy` solo acepta URLs HTTPS de hosts permitidos (`grupoei.com.mx`, `aduax.com`, `.amazonaws.com` y subdominios).
