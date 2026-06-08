# PrevioMX

PrevioMX es un sistema de captura de previos aduanales compuesto por una API
ASP.NET Core y una SPA React/Vite. La aplicacion permite iniciar sesion,
consultar pendientes por equipo, capturar partidas de una referencia, validar
clasificaciones y cerrar o reabrir previos con reglas respaldadas por stored
procedures en SQL Server.

## Arquitectura

```text
PrevioMX_Web (React/Vite)
  |-- login, dashboard y captura
  |-- Axios con JWT en Authorization: Bearer <token>
  |-- visor PDF/OCR con pdfjs-dist y tesseract.js
        |
        v
PrevioMX_Api (.NET 8 Web API)
  |-- AuthController: login JWT
  |-- VisualizationController: pendientes, partidas, OpenPO, cierre, PDF proxy
  |-- CatalogosController / ClasificacionController / ProtectedController
        |
        v
SQL Server (base Aduasis)
  |-- CSP_PMX_* / csp_PMX_* / SP_FEA_* / sp_previo_TL
```

El backend no usa migraciones EF para el dominio de negocio; `AuthDbContext`
ejecuta stored procedures y mapea result sets a DTOs. El frontend consume la API
desde `PrevioMX_Web/src/services/previo.service.js`.

## Estructura del repositorio

```text
.
├── PrevioMX_Api/          # API .NET 8, JWT, EF Core, Swagger, SQL Server
│   ├── Controllers/       # Endpoints HTTP
│   ├── Business/          # Servicios y AuthDbContext
│   ├── DTO/               # Contratos request/response
│   └── HelpFiles/         # Guias tecnicas de API y operacion
└── PrevioMX_Web/          # React 18 + Vite 5
    ├── src/views/         # Login, dashboard y captura
    ├── src/components/    # Componentes de captura, PDF/OCR y UI comun
    ├── src/services/      # Clientes Axios por dominio
    └── public/web.config  # Reglas IIS para SPA y .mjs
```

## Arranque local

### API

```bash
cd PrevioMX_Api
dotnet restore
dotnet run
```

En desarrollo, Swagger queda disponible en `https://localhost:5001/swagger`
cuando el perfil local expone HTTPS. La API espera:

- `ConnectionStrings:DefaultConnection` apuntando a SQL Server.
- `JwtSettings:SecretKey`, `Issuer`, `Audience` y `ExpirationMinutes`.
- Acceso a los stored procedures listados en
  [`PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md`](PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md).

No commitees secretos reales en `appsettings*.json`; usa variables de entorno,
secret manager o configuracion del host para ambientes compartidos.

### Web

```bash
cd PrevioMX_Web
npm install
npm run dev
```

Vite sirve la SPA en `http://localhost:5173`. Si no existe
`VITE_API_BASE_URL`, el cliente usa `https://localhost:5001` en desarrollo y
`http://192.168.6.185/PrevioMX/Api` en produccion.

Ejemplo de `.env.development`:

```bash
VITE_API_BASE_URL=https://localhost:5001
```

## Flujo funcional principal

1. `LoginView` envia `{ usuario, password }` a `POST /api/Auth/login`.
2. `AuthProvider` guarda `token` y `user` en `localStorage`.
3. `DashboardView` consulta `GET /api/Visualization/pendientes/{equipo}` usando
   el equipo del usuario autenticado.
4. `CaptureView` abre `/capture/:reference`, carga detalle de entrada,
   catalogos, POs y documentos asociados.
5. El usuario registra, actualiza o elimina partidas; tambien puede validar
   clasificacion, marca, modelo, cuarentenas, OpenPO y cierre de previo.
6. Para documentos externos, `PdfOcrViewer` usa
   `GET /api/Visualization/pdf-proxy?url=...` si la URL del PDF esta en otro
   origen permitido.

## Documentacion tecnica

- [README del frontend](PrevioMX_Web/README.md): scripts, rutas, configuracion
  de API y despliegue IIS.
- [Autenticacion JWT](PrevioMX_Api/HelpFiles/AUTENTICACION_JWT.md): login real,
  claims del token, Swagger y troubleshooting.
- [Guia de endpoints](PrevioMX_Api/HelpFiles/USO_ENDPOINTS.md): endpoints
  publicos/protegidos y flujo de captura.
- [Stored procedures](PrevioMX_Api/HelpFiles/STORED_PROCEDURES.md): inventario
  de procedimientos invocados por `AuthDbContext`.

## Puntos de operacion y troubleshooting

- Todos los endpoints de negocio usan `[Authorize]`; envia siempre
  `Authorization: Bearer <token>` salvo en `/api/Auth/*`.
- `register` y `refresh` existen como rutas, pero sus servicios devuelven
  `null` hasta que se implemente el stored procedure correspondiente.
- El cierre de previo toma `idUsuario` desde el claim
  `ClaimTypes.NameIdentifier`; si el token no contiene ese claim, responde 401.
- El proxy PDF solo acepta URLs HTTPS de `grupoei.com.mx`, `aduax.com` y
  subdominios de `amazonaws.com`.
- En IIS, conserva `PrevioMX_Web/public/web.config`: permite servir
  `pdf.worker.min.mjs` y reescribe rutas SPA a `index.html`.
