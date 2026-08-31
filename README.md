# PrevioMX

Monorepo de captura de previos aduanales: API .NET 8 + frontend React/Vite.

## Arquitectura

```
┌─────────────────┐     JWT Bearer      ┌──────────────────────┐
│  PrevioMX_Web   │ ──────────────────► │  PrevioMX_Api        │
│  React + Vite   │                     │  ASP.NET Core 8      │
│  /PrevioMX      │                     │  Swagger (solo Dev)  │
└─────────────────┘                     └──────────┬───────────┘
                                                   │ SqlQueryRaw / ADO
                                                   ▼
                                        SQL Server (Aduasis)
                                        Stored procedures CSP_PMX_*
```

| Capa | Ruta | Rol |
|------|------|-----|
| Web | `PrevioMX_Web/` | Login, dashboard de pendientes, captura de partidas, OCR de PDF |
| API | `PrevioMX_Api/` | JWT, catálogos, visualización, clasificación, proxy PDF |
| Datos | SQL Server | Lógica de negocio en stored procedures; EF Core solo ejecuta SPs |

La UI **no** habla con SQL. Toda persistencia pasa por `AuthDbContext` (`PrevioMX_Api/Business/AuthDbContext.cs`).

## Setup local

### API

1. .NET 8 SDK.
2. Cadena `ConnectionStrings:DefaultConnection` en `PrevioMX_Api/appsettings.json` (o variables de entorno). Apunta a la base **Aduasis**.
3. DLLs externas `onecore.security.encryptvr` y `onecore.security.services` (HintPaths fuera del repo; ver `PrevioMX_Api.csproj`). Sin ellas el proyecto no compila.
4. Perfil `https` (`launchSettings.json`): `https://localhost:5001` y `http://localhost:5000`. Swagger: `/swagger` (solo `Development`).

```bash
cd PrevioMX_Api
dotnet run --launch-profile https
```

### Web

```bash
cd PrevioMX_Web
npm install
# .env.development ya define VITE_API_BASE_URL=https://localhost:5001
npm run dev
```

- Dev server Vite: `http://localhost:5173`
- `basename` y `base` de producción: `/PrevioMX/`
- URL de desarrollo: `http://localhost:5173/PrevioMX/`

CORS de la API permite solo `http://localhost:5173`, `http://localhost:3000` y `http://localhost:5000`. Un origen de producción no listado será bloqueado en el navegador.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [PrevioMX_Api/HelpFiles/README.md](PrevioMX_Api/HelpFiles/README.md) | Índice de la API |
| [PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md](PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md) | Contratos HTTP |
| [PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md](PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md) | JWT real vs rutas no implementadas |
| [PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md](PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md) | SPs invocados por el código |
| [PrevioMX_Web/README.md](PrevioMX_Web/README.md) | Setup, env, rutas y trampas del frontend |
| [PrevioMX_Web/docs/FLUJO_CAPTURA.md](PrevioMX_Web/docs/FLUJO_CAPTURA.md) | Dashboard → captura, MMS, OpenPO, cierre |

## Restricciones verificadas

- `register` y `refresh` existen en `AuthController` pero `AuthService` retorna `null` (409 / 401).
- `appsettings.json` está marcado como `EmbeddedResource` (`CopyToOutputDirectory=Always`).
- No hay migraciones EF: no crear tablas `Users` ni SPs `sp_GetUserByEmail` para este producto.
- No documentar contraseñas de connection string; usar secretos o variables de entorno.
