# Cómo Usar Autenticación JWT en Swagger UI

## Pasos para Autenticarse en Swagger

### Paso 1: Obtener el Token

1. Abre Swagger UI en el ambiente de la API, por ejemplo `https://localhost:5001/swagger`
2. Busca el endpoint `POST /api/Auth/login`
3. Haz clic en "Try it out"
4. Ingresa tus credenciales:
   ```json
   {
     "usuario": "YROSALES.MTY",
     "password": "123"
   }
   ```
5. Haz clic en "Execute"
6. En la respuesta, **copia SOLO el valor del campo `token`** (sin comillas)

**Ejemplo de respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "itvKoqerI7o8Gdmi1UbNFUJa666ZkJJOAjlsnX5K6pthnMBPPFwm...",
  "user": { ... }
}
```

**Copia esto:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (solo el token, sin comillas)

### Paso 2: Autorizar en Swagger

1. En la parte superior de Swagger UI, busca el botón **"Authorize"** (🔒)
2. Haz clic en "Authorize"
3. En el campo que aparece, ingresa: `Bearer {tu_token}`

**⚠️ IMPORTANTE:**
- NO pongas solo "Bearer Token" (esas palabras literales)
- NO pongas solo el token sin "Bearer"
- Debes poner: `Bearer ` (con espacio) seguido del token completo

**Ejemplo correcto:**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IllSTyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Inlyb3NhbGVzLm10eUBncnVwb2VpLmNvbS5teCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ5cm9zYWxlcy5tdHkiLCJFcXVpcG8iOiJNQU5DSEVTVEVSIiwiR3J1cG9JZCI6IjczRjI5MTU2LTlERjctNEY5Ni1CQTRGLTY5M0FDREQ3NTU5MCIsIkxpZGVyIjoieXJvc2FsZXMubXR5IiwianRpIjoiMTUyMTJjYTYtZDllZi00NDQwLThjYmQtZTU0Yzc0ZGU1NzdlIiwiZXhwIjoxNzY0MzY4NjcyLCJpc3MiOiJQcmV2aW9NWF9BUEkiLCJhdWQiOiJQcmV2aW9NWF9XZWIifQ.w96Vs2ZCq181ZYGMToDaBxbA5zhfeZd7gPPDycYmlIw
```

4. Haz clic en "Authorize"
5. Haz clic en "Close"

### Paso 3: Probar Endpoints Protegidos

Ahora los endpoints protegidos (por ejemplo `/api/Visualization/pendientes/{equipo}`) deberían funcionar. Verás un candado 🔒 al lado de los endpoints que requieren autenticación.

## Errores Comunes

### Error: "Se requiere autenticación..."

**Causa:** No pusiste el token o el formato es incorrecto.

**Solución:**
- Asegúrate de copiar el token completo (puede ser muy largo)
- Verifica que hayas puesto `Bearer ` (con espacio) antes del token
- No pongas comillas alrededor del token

### Error: "Token de autenticación tiene una firma inválida"

**Causa:** El token fue generado con un SecretKey diferente.

**Solución:**
- Obtén un nuevo token haciendo login nuevamente
- Verifica que el `SecretKey` en `appsettings.json` sea el correcto

### Error: "Bearer Token" literal

**Causa:** Pusiste las palabras "Bearer Token" en lugar del token real.

**Solución:**
- Debes poner: `Bearer ` seguido del token que obtuviste del login
- El token es una cadena muy larga que empieza con `eyJ...`

## Verificar que Funciona

1. Después de autorizar, intenta ejecutar `GET /api/Visualization/pendientes/{equipo}`
   con un equipo valido del usuario.
2. Si funciona, verás un código `200 OK` con los datos
3. Si ves `401 Unauthorized`, revisa los pasos anteriores

## Notas

- El token expira segun `JwtSettings:ExpirationMinutes` (`1440` minutos en el
  `appsettings.json` versionado)
- Si el token expira, necesitarás hacer login nuevamente y re-autorizar
- Puedes verificar si estás autorizado viendo el candado 🔒 en los endpoints protegidos

