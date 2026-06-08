# Autenticacion JWT en Swagger UI

Swagger se habilita en desarrollo desde `Program.cs`. La URL local habitual es
`https://localhost:5001/swagger`.

## 1. Obtener token

Ejecuta `POST /api/Auth/login`:

```json
{
  "usuario": "YROSALES.MTY",
  "password": "password"
}
```

En la respuesta copia solo el valor de `token`, sin comillas:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-refresh-token",
  "user": {
    "idUsuario": "123",
    "usuario": "YROSALES.MTY",
    "equipo": "MANCHESTER"
  }
}
```

## 2. Autorizar Swagger

1. Haz clic en **Authorize**.
2. Escribe `Bearer ` seguido del token completo.
3. Confirma con **Authorize** y cierra el modal.

Formato:

```text
Bearer eyJhbGciOiJIUzI1NiIs...
```

No uses las palabras literales `Bearer Token`, no pegues el JSON completo y no
incluyas el `refreshToken`.

## 3. Probar endpoints protegidos

Usa endpoints de negocio reales, por ejemplo:

- `GET /api/Visualization/pendientes/{equipo}`
- `GET /api/Visualization/detalle-entrada/{idEntrada}`
- `GET /api/Catalogos/{catalogo}`
- `POST /api/Clasificacion/validar-post`

Consulta [USO_ENDPOINTS.md](USO_ENDPOINTS.md) para bodies y parametros.

## Errores comunes

| Sintoma | Causa probable | Accion |
| --- | --- | --- |
| `Se requiere autenticacion` | No se autorizo Swagger o falta `Bearer`. | Repetir el paso de autorizacion. |
| Firma invalida | Token truncado o `SecretKey` distinta. | Hacer login nuevamente y revisar configuracion. |
| Token expirado | `exp` ya vencio. | Hacer login nuevamente; refresh no esta implementado. |
| 401 en Team Leader | Token de aprobacion incorrecto. | Revisar el token capturado para esa aprobacion. |
