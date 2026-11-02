# HelpFiles — PrevioMX API

Guías de operación verificadas contra controladores y `AuthDbContext`.

| Archivo | Para qué |
|---|---|
| [USO_ENDPOINTS.md](USO_ENDPOINTS.md) | Contratos HTTP, auth, catálogos, visualización, clasificación |
| [AUTENTICACION_JWT.md](AUTENTICACION_JWT.md) | Login, claims, expiración, rutas no implementadas |
| [FORMATO_TOKEN.md](FORMATO_TOKEN.md) | Header `Authorization: Bearer` |
| [SWAGGER_AUTENTICACION.md](SWAGGER_AUTENTICACION.md) | Swagger solo en Development |
| [CURL_CORRECTO.md](CURL_CORRECTO.md) | Ejemplos cURL (sin tokens reales) |
| [CONFIGURACION_BD.md](CONFIGURACION_BD.md) | Connection string y EF |
| [STORED_PROCEDURES.md](STORED_PROCEDURES.md) | SPs que el código sí ejecuta |
| [RUNBOOK.md](RUNBOOK.md) | Síntomas, causas y trampas de setup |

No hay scripts SQL de creación en este repo. No inventar tablas `Users` ni SPs de plantilla (`sp_GetUserByEmail`, etc.).
