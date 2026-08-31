# Swagger UI

Swagger se registra **solo** si `ASPNETCORE_ENVIRONMENT=Development` (`Program.cs`). En el perfil `https`: `https://localhost:5001/swagger`.

## Autorizar

1. `POST /api/Auth/login` con `{ "usuario": "...", "password": "..." }`.
2. Copiar **solo** `token` (no `refreshToken`).
3. Botón **Authorize** → campo: `Bearer {token}` (espacio obligatorio).
4. Authorize → Close.

El scheme Swagger es `ApiKey` en header `Authorization`. Si pegas solo el JWT sin `Bearer `, la API responde 401.

## Qué probar después

Cualquier ruta `[Authorize]`. Humo: `GET /WeatherForecast` o `GET /api/Protected/test`. Negocio: `GET /api/Visualization/pendientes/{equipo}` usando el `equipo` del `user` del login.

## No usar

- `POST /api/Auth/register` y `/refresh` (siempre 409/401).
- `GET /api/Clasificacion/{entrada}/{producto}` (no existe).

## Errores

| Síntoma | Qué hacer |
|---------|-----------|
| 401 “Se requiere autenticación” | Falta `Bearer ` o el token está truncado |
| Firma inválida | Nuevo login; no cambiar `SecretKey` a mitad de prueba |
| Swagger 404 | No estás en Development |

Expiración configurada: 1440 min (`appsettings`). Si quitas la clave, `JwtService` usa 60.
