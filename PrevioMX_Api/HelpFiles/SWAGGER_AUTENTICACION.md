# Swagger

Swagger UI **solo** se habilita si `ASPNETCORE_ENVIRONMENT=Development` (`Program.cs`). En el perfil `https` de `launchSettings.json` abre `https://localhost:5001/swagger`. Perfil `http`: `http://localhost:5000/swagger`.

## Autorizar

1. `POST /api/Auth/login` con `{ "usuario", "password" }`.
2. Copiar **solo** `token`.
3. Botón Authorize → `Bearer {token}` (espacio después de Bearer).
4. Probar rutas `[Authorize]`.

Esquema Swagger: `ApiKey` en header `Authorization` (no el helper nativo Bearer de OpenAPI). Hay que escribir el prefijo `Bearer `.

## No usar como contrato

- `register` / `refresh` responden 409 / 401.
- `GET /WeatherForecast` es leftover.
- `validar-cuarentenas` no tiene UI.

Si Swagger no carga: confirmar ambiente Development. En IIS/preproducción no está montado.

Expiración: `JwtSettings.ExpirationMinutes` = 1440 en appsettings; fallback de código = 60.
