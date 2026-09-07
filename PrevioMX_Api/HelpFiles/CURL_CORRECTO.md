# cURL

Perfil `https`: `https://localhost:5001`. Perfil `http`: `http://localhost:5000`.

El header `Authorization` lleva **solo** el JWT. El `refreshToken` no se envía (y el endpoint de refresh no está implementado).

## Login

```bash
curl -s -X POST "https://localhost:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usuario":"USUARIO.OFICINA","password":"***"}'
```

Guardar el campo `token` (no el JSON completo):

```bash
TOKEN="<pegar token JWT>"
```

## Endpoints protegidos

```bash
# Pendientes del equipo (claim Equipo del usuario)
curl -s "https://localhost:5001/api/Visualization/pendientes/${EQUIPO}" \
  -H "Authorization: Bearer $TOKEN"

# Catálogo UM (id 1) y países (id 2)
curl -s "https://localhost:5001/api/Catalogos/1" \
  -H "Authorization: Bearer $TOKEN"

# Clasificación (flujo que usa el frontend)
curl -s -X POST "https://localhost:5001/api/Clasificacion/validar-post" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"idEntrada":"REF-001","idProducto":"PARTE-1"}'

# Eliminar partida: DELETE con body JSON
curl -s -X DELETE "https://localhost:5001/api/Visualization/eliminar-partida" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"idBulto":"B1","referencia":"REF-001","idProducto":"PARTE-1"}'
```

## Errores

- Header con `refreshToken` mezclado, comillas extra o el token truncado → 401.
- Expiración: `JwtSettings.ExpirationMinutes` = 1440 en appsettings; fallback de código = 60 si la clave falta.
- `GET /WeatherForecast` solo sirve para probar JWT; no es un endpoint de negocio.
