# PrevioMX

Monorepo de PrevioMX: una API .NET 8 protegida con JWT y una SPA React/Vite para visualizar pendientes, capturar partidas de packing list y cerrar previos.

## Arquitectura

```text
PrevioMX_Web (React/Vite)
  -> services/*.js (Axios + JWT)
  -> PrevioMX_Api (ASP.NET Core)
  -> AuthDbContext (EF Core + SQL Server)
  -> stored procedures CSP_PMX_*, csp_PMX_* y SP_FEA_*
```

- La API expone controllers bajo `/api/*` y usa `AuthDbContext` para ejecutar stored procedures.
- El frontend guarda `token`, `user` y `captureData` en `localStorage`; el cliente Axios agrega `Authorization: Bearer {token}`.
- La ruta principal de trabajo es `/dashboard` -> `/capture/:reference`.

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

URLs locales verificadas en `Properties/launchSettings.json`:

- HTTPS: `https://localhost:5001`
- HTTP: `http://localhost:5000`
- Swagger en desarrollo: `/swagger`

Configuración requerida:

- `ConnectionStrings:DefaultConnection`: conexión a SQL Server.
- `JwtSettings:SecretKey`, `Issuer`, `Audience`, `ExpirationMinutes`: validación y emisión de JWT.

### Web

```bash
cd PrevioMX_Web
npm install
npm run dev
```

- Vite publica por defecto en `http://localhost:5173`.
- `VITE_API_BASE_URL` debe apuntar a la raíz de la API, por ejemplo `https://localhost:5001` (sin agregar `/api`; los servicios ya lo incluyen).
- Si no se define, `src/config/api.config.js` usa `https://localhost:5001` en desarrollo.

## Documentación clave

- API de negocio: `PrevioMX_Api/HelpFiles/ENDPOINTS_DOMINIO.md`
- Stored procedures usados por la API: `PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md`
- Flujo de captura web: `PrevioMX_Web/docs/FLUJO_CAPTURA.md`
- README del frontend: `PrevioMX_Web/README.md`

## Operación y despliegue web

- `PrevioMX_Web/vite.config.js` define `base: '/PrevioMX/'`; los assets se generan para publicarse bajo ese subdirectorio.
- El build copia `pdf.worker.min.mjs` a `dist/` para PDF.js.
- `PrevioMX_Web/public/web.config` configura IIS para servir `.mjs` y reescribir rutas SPA hacia `index.html`.
- El proxy de PDF de la API (`GET /api/Visualization/pdf-proxy`) solo acepta URLs HTTPS de hosts permitidos por el controller.

