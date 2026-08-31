# HelpFiles — PrevioMX API

Guías de operación verificadas contra `Controllers/*`, `Business/AuthDbContext.cs` y `Program.cs`.

| Guía | Uso |
|------|-----|
| [USO_ENDPOINTS.md](USO_ENDPOINTS.md) | Contratos HTTP (auth, catálogos, visualización, clasificación) |
| [AUTENTICACION_JWT.md](AUTENTICACION_JWT.md) | Login, claims, expiración, rutas no implementadas |
| [FORMATO_TOKEN.md](FORMATO_TOKEN.md) | Header `Authorization: Bearer {token}` |
| [SWAGGER_AUTENTICACION.md](SWAGGER_AUTENTICACION.md) | Autorizar en Swagger UI (solo Development) |
| [CURL_CORRECTO.md](CURL_CORRECTO.md) | Ejemplos cURL de flujos reales |
| [CONFIGURACION_BD.md](CONFIGURACION_BD.md) | SQL Server / Aduasis, EF como ejecutor de SPs |
| [STORED_PROCEDURES.md](STORED_PROCEDURES.md) | Nombres y parámetros que el código sí invoca |

`WeatherForecast` y `GET /api/Protected/test` existen como smoke tests; no son el flujo de negocio.
