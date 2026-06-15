# PrevioMX

PrevioMX es una aplicacion de captura y seguimiento de previos. El repositorio
contiene una API .NET 8 y una SPA React/Vite que se comunican por HTTP usando
JWT Bearer.

## Arquitectura

| Capa | Ruta | Responsabilidad |
| --- | --- | --- |
| API | `PrevioMX_Api/` | Autenticacion, endpoints de negocio, Swagger y acceso a SQL Server por stored procedures. |
| Web | `PrevioMX_Web/` | Login, dashboard de pendientes, captura de partidas, visor PDF/OCR y cierre/reapertura de previo. |
| Base de datos | SQL Server `Aduasis` | Procedimientos `CSP_PMX_*`, `csp_PMX_*`, `sp_previo_TL` y `SP_FEA_*` llamados desde `AuthDbContext`. |

Flujo principal:

1. El usuario inicia sesion con `POST /api/Auth/login`.
2. La web guarda `token` y `user` en `localStorage`.
3. El dashboard consulta pendientes por `user.equipo`.
4. Al abrir una referencia, la web guarda `captureData` y navega a
   `/capture/:reference`.
5. La captura consulta detalle, catalogos, proveedor, PDFs y validaciones antes
   de registrar/actualizar/eliminar partidas o cerrar el previo.

## Puesta en marcha local

### API

```bash
cd PrevioMX_Api
dotnet restore
dotnet run
```

La API usa `ConnectionStrings:DefaultConnection` y `JwtSettings` desde
`appsettings*.json` o variables de entorno. Los endpoints protegidos requieren:

```http
Authorization: Bearer {token}
```

### Web

```bash
cd PrevioMX_Web
npm install
npm run dev
```

Vite sirve por defecto en `http://localhost:5173`. Si no se configura
`VITE_API_BASE_URL`, la web usa `https://localhost:5001` en desarrollo y
`http://192.168.6.185/PrevioMX/Api` en build de produccion.

## Documentacion tecnica

- API y endpoints: `PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md`
- Autenticacion JWT: `PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md`
- Swagger con Bearer token: `PrevioMX_Api/HelpFiles/SWAGGER_AUTENTICACION.md`
- Stored procedures usados por la API: `PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md`
- Configuracion de base de datos: `PrevioMX_Api/HelpFiles/CONFIGURACION_BD.md`
- Frontend, rutas y flujo de captura: `PrevioMX_Web/README.md`

## Restricciones operativas conocidas

- `register` y `refresh` existen como rutas en `AuthController`, pero
  `AuthService` aun devuelve `null`; el flujo soportado es hacer login otra vez.
- La API de negocio esta protegida con JWT salvo `AuthController`.
- El proxy de PDFs solo acepta URLs HTTPS de dominios permitidos por
  `VisualizationController`.
- El build web usa `base: '/PrevioMX/'`; si se publica bajo otra ruta debe
  ajustarse `vite.config.js`.
