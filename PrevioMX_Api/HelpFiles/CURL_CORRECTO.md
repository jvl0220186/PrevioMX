# Comando cURL Correcto para Endpoints Protegidos

## ❌ INCORRECTO (Tu comando actual)

```bash
curl -X 'GET' \
  'https://localhost:7145/WeatherForecast' \
  -H 'accept: text/plain' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",   "refreshToken": "itvKoqerI7o8Gdmi1UbNFUJa666ZkJJOAjlsnX5K6pthnMBPPFwm/WhAKET9dVjAew7GR4FfmrWdznRafpntaw=='
```

**Problemas:**
1. El `refreshToken` NO debe ir en el header `Authorization`
2. El header tiene comillas y formato JSON incorrecto
3. El `refreshToken` es solo para el endpoint `/api/auth/refresh`, no para otros endpoints

## ✅ CORRECTO

```bash
curl -X 'GET' \
  'https://localhost:7145/WeatherForecast' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IllSTyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Inlyb3NhbGVzLm10eUBncnVwb2VpLmNvbS5teCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ5cm9zYWxlcy5tdHkiLCJFcXVpcG8iOiJNQU5DSEVTVEVSIiwiR3J1cG9JZCI6IjczRjI5MTU2LTlERjctNEY5Ni1CQTRGLTY5M0FDREQ3NTU5MCIsIkxpZGVyIjoieXJvc2FsZXMubXR5IiwianRpIjoiMTUyMTJjYTYtZDllZi00NDQwLThjYmQtZTU0Yzc0ZGU1NzdlIiwiZXhwIjoxNzY0MzY4NjcyLCJpc3MiOiJQcmV2aW9NWF9BUEkiLCJhdWQiOiJQcmV2aW9NWF9XZWIifQ.w96Vs2ZCq181ZYGMToDaBxbA5zhfeZd7gPPDycYmlIw'
```

## Formato Correcto del Header

El header `Authorization` debe tener **SOLO** el token JWT:

```
Authorization: Bearer {token_completo_sin_espacios_ni_comillas}
```

**Ejemplo:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IllSTyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Inlyb3NhbGVzLm10eUBncnVwb2VpLmNvbS5teCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ5cm9zYWxlcy5tdHkiLCJFcXVpcG8iOiJNQU5DSEVTVEVSIiwiR3J1cG9JZCI6IjczRjI5MTU2LTlERjctNEY5Ni1CQTRGLTY5M0FDREQ3NTU5MCIsIkxpZGVyIjoieXJvc2FsZXMubXR5IiwianRpIjoiMTUyMTJjYTYtZDllZi00NDQwLThjYmQtZTU0Yzc0ZGU1NzdlIiwiZXhwIjoxNzY0MzY4NjcyLCJpc3MiOiJQcmV2aW9NWF9BUEkiLCJhdWQiOiJQcmV2aW9NWF9XZWIifQ.w96Vs2ZCq181ZYGMToDaBxbA5zhfeZd7gPPDycYmlIw
```

## Comando cURL Simplificado (Una Línea)

```bash
curl -X GET "https://localhost:7145/WeatherForecast" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IllSTyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Inlyb3NhbGVzLm10eUBncnVwb2VpLmNvbS5teCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ5cm9zYWxlcy5tdHkiLCJFcXVpcG8iOiJNQU5DSEVTVEVSIiwiR3J1cG9JZCI6IjczRjI5MTU2LTlERjctNEY5Ni1CQTRGLTY5M0FDREQ3NTU5MCIsIkxpZGVyIjoieXJvc2FsZXMubXR5IiwianRpIjoiMTUyMTJjYTYtZDllZi00NDQwLThjYmQtZTU0Yzc0ZGU1NzdlIiwiZXhwIjoxNzY0MzY4NjcyLCJpc3MiOiJQcmV2aW9NWF9BUEkiLCJhdWQiOiJQcmV2aW9NWF9XZWIifQ.w96Vs2ZCq181ZYGMToDaBxbA5zhfeZd7gPPDycYmlIw"
```

## Usar Variable para el Token

```bash
# Guardar el token en una variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IllSTyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Inlyb3NhbGVzLm10eUBncnVwb2VpLmNvbS5teCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ5cm9zYWxlcy5tdHkiLCJFcXVpcG8iOiJNQU5DSEVTVEVSIiwiR3J1cG9JZCI6IjczRjI5MTU2LTlERjctNEY5Ni1CQTRGLTY5M0FDREQ3NTU5MCIsIkxpZGVyIjoieXJvc2FsZXMubXR5IiwianRpIjoiMTUyMTJjYTYtZDllZi00NDQwLThjYmQtZTU0Yzc0ZGU1NzdlIiwiZXhwIjoxNzY0MzY4NjcyLCJpc3MiOiJQcmV2aW9NWF9BUEkiLCJhdWQiOiJQcmV2aW9NWF9XZWIifQ.w96Vs2ZCq181ZYGMToDaBxbA5zhfeZd7gPPDycYmlIw"

# Usar el token
curl -X GET "https://localhost:7145/WeatherForecast" \
  -H "Authorization: Bearer $TOKEN"
```

## Notas Importantes

1. **El refreshToken NO va en el header Authorization**
   - El `refreshToken` solo se usa en el endpoint `/api/auth/refresh`
   - Para otros endpoints, solo necesitas el `token` JWT

2. **Formato del header:**
   - `Authorization: Bearer {token}`
   - Sin comillas alrededor del token
   - Un solo espacio después de "Bearer"
   - El token completo sin espacios ni saltos de línea

3. **Verificar el token:**
   - El token debe ser el que obtuviste del endpoint `/api/auth/login`
   - Copia solo el valor del campo `token` de la respuesta JSON
   - No incluyas el `refreshToken` en el header

## Si Sigue Dando 401

1. **Verifica que el token no haya expirado:**
   - El token expira en 60 minutos
   - Haz login nuevamente para obtener un nuevo token

2. **Verifica el SecretKey:**
   - El `SecretKey` en `appsettings.json` debe ser el mismo usado para generar el token
   - Si cambiaste el SecretKey, necesitas generar un nuevo token

3. **Revisa los logs de la aplicación:**
   - Ahora los logs mostrarán el tipo de error específico
   - Busca mensajes que digan "Error de autenticación JWT"

