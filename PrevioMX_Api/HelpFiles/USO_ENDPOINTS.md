# Guía de Uso de Endpoints

> Para los endpoints reales de negocio (pendientes, captura, OpenPO, catalogos, clasificacion, cierre y reapertura), consulta `ENDPOINTS_DOMINIO.md`. Esta guia conserva el flujo basico de autenticacion y Swagger.

## Endpoints Públicos (No requieren autenticación)

### POST /api/auth/login

Iniciar sesión y obtener token JWT.

**Request:**
```json
{
  "usuario": "YROSALES.MTY",
  "password": "123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "idUsuario": "YRO",
    "usuario": "yrosales.mty",
    "correoElectronico": "yrosales.mty@grupoei.com.mx",
    "equipo": "MANCHESTER",
    "grupoId": "73F29156-9DF7-4F96-BA4F-693ACDD75590",
    "lider": "yrosales.mty"
  }
}
```

## Endpoints Protegidos (Requieren autenticación JWT)

Los controllers de dominio (`Visualization`, `Catalogos`, `Clasificacion` y `Protected`) requieren JWT. Ejemplo con un endpoint usado por el dashboard:

**Headers requeridos:**
```
Authorization: Bearer {token}
```

**Ejemplo con cURL:**
```bash
curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo con JavaScript/Fetch:**
```javascript
const token = "tu_token_aqui";

const response = await fetch('https://localhost:5001/api/Visualization/pendientes/MANCHESTER', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

**Ejemplo con Postman:**
1. Ve a la pestaña "Authorization"
2. Selecciona "Bearer Token"
3. Pega tu token en el campo "Token"
4. Realiza la petición

## Flujo Completo

### Paso 1: Obtener Token

```bash
# Login
curl -X POST "https://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "YROSALES.MTY",
    "password": "123"
  }'
```

### Paso 2: Usar el Token

```bash
# Guardar el token de la respuesta anterior
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Usar el token para acceder a endpoints protegidos
curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer $TOKEN"
```

## Errores Comunes

### Error 401 Unauthorized

**Causa:** No se envió el token o el token es inválido/expirado.

**Solución:**
1. Verifica que estés enviando el header `Authorization: Bearer {token}`
2. Verifica que el token no haya expirado (por defecto expira en 60 minutos)
3. Obtén un nuevo token haciendo login nuevamente

### Error 403 Forbidden

**Causa:** El token es válido pero no tienes permisos para acceder al recurso.

**Solución:** Verifica los permisos del usuario en el sistema.

## En Swagger UI

1. Abre Swagger UI: `https://localhost:5001/swagger`
2. Ejecuta `/api/auth/login` para obtener el token
3. Copia el `token` de la respuesta
4. Haz clic en el botón **"Authorize"** (🔒) en la parte superior
5. Pega el token en el formato: `Bearer {tu_token}`
6. Haz clic en "Authorize" y luego "Close"
7. Ahora puedes probar los endpoints protegidos (aparecerán con un candado 🔒)

## Notas Importantes

- El token JWT tiene una expiración configurada (por defecto 60 minutos)
- Si el token expira, necesitarás hacer login nuevamente
- El token debe enviarse en cada petición a endpoints protegidos
- El formato del header es: `Authorization: Bearer {token}` (con espacio después de "Bearer")
- `POST /api/Auth/register` y `POST /api/Auth/refresh` estan expuestos, pero el servicio actual no los implementa.

