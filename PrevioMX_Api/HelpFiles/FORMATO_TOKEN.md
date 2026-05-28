# Formato correcto del token JWT

Si la API responde `401` o "firma invalida", primero revisa el formato del header
`Authorization`.

## Formato correcto

```http
Authorization: Bearer eyJhbGciOi...
```

Caracteristicas:

- Sin comillas alrededor del token.
- Un solo espacio despues de `Bearer`.
- Token completo, sin saltos de linea ni texto adicional.
- No incluir `refreshToken` en el header.

## Formatos incorrectos

```http
Authorization: Bearer "eyJhbGciOi..."
Authorization: "Bearer eyJhbGciOi..."
Authorization: Bearer  eyJhbGciOi...
Authorization: Bearer eyJhbGciOi..., "refreshToken": "..."
```

## Ejemplos por herramienta

### cURL

```bash
curl -X GET "https://localhost:5001/api/Visualization/pendientes/MANCHESTER" \
  -H "Authorization: Bearer eyJhbGciOi..."
```

### JavaScript/Fetch

```javascript
const token = 'eyJhbGciOi...'

const response = await fetch('https://localhost:5001/api/Visualization/pendientes/MANCHESTER', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

### Axios

```javascript
const token = 'eyJhbGciOi...'

axios.get('https://localhost:5001/api/Visualization/pendientes/MANCHESTER', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

### Postman

Opcion recomendada:

1. Abre la pestaña **Authorization**.
2. Selecciona **Bearer Token**.
3. Pega el token sin escribir `Bearer`.

Opcion manual:

1. Abre **Headers**.
2. Agrega `Authorization`.
3. Usa `Bearer eyJhbGciOi...` como valor.

## Verificacion del token

Puedes decodificar el JWT para inspeccionar:

- `alg`: `HS256`.
- `iss`: `PrevioMX_API`.
- `aud`: `PrevioMX_Web`.
- `exp`: debe estar en el futuro.
- Claims esperados: `NameIdentifier`, `Email`, `Name`, `Equipo`, `GrupoId`, `Lider`.

No compartas tokens reales en tickets, commits ni capturas de pantalla.

## Troubleshooting

- **Firma invalida**: la `SecretKey` configurada no coincide o el token fue truncado.
- **Token expirado**: vuelve a hacer login; refresh no esta implementado funcionalmente.
- **Issuer/Audience invalido**: revisa `JwtSettings` en `appsettings.json`.
- **401 en un endpoint de negocio**: confirma que el controlador requiere `[Authorize]` y
  que el header llega a la API/proxy sin ser filtrado.
