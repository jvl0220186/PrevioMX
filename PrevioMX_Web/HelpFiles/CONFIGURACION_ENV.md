# Configuración de Variables de Entorno

Esta guía explica cómo configurar las variables de entorno para desarrollo y producción.

## ¿Cómo funciona Vite con .env?

Vite carga automáticamente los archivos `.env` según el modo en que ejecutas la aplicación:

- `npm run dev` → Carga `.env.development` (o `.env` si no existe)
- `npm run build` → Carga `.env.production` (o `.env` si no existe)

**Prioridad de carga:**
1. `.env.local` (siempre se carga, ignorado por git)
2. `.env.[mode].local` (ej: `.env.development.local`)
3. `.env.[mode]` (ej: `.env.development`)
4. `.env` (fallback)

## Configuración para Desarrollo

### Opción 1: Archivo único `.env`

Crea un archivo `.env` en la raíz del proyecto:

```env
# .env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Opción 2: Archivo específico `.env.development`

Crea un archivo `.env.development`:

```env
# .env.development
VITE_API_BASE_URL=http://localhost:5000/api
```

**Ejemplo completo para desarrollo:**
```env
# URL de la API local
VITE_API_BASE_URL=http://localhost:5000/api

# Configuraciones opcionales
# VITE_DEBUG=true
# VITE_LOG_LEVEL=debug
```

## Configuración para Producción

### Opción 1: Archivo `.env.production`

Crea un archivo `.env.production` en la raíz del proyecto:

```env
# .env.production
VITE_API_BASE_URL=https://api.tudominio.com/api
```

**Ejemplo completo para producción:**
```env
# URL de la API en producción
VITE_API_BASE_URL=https://api.previo.com/api

# Configuraciones opcionales
# VITE_DEBUG=false
# VITE_LOG_LEVEL=error
```

### Opción 2: Variables de entorno en la plataforma de deployment

Si usas plataformas como **Vercel**, **Netlify**, **Azure**, etc., configura las variables directamente en el panel de control:

**Vercel:**
1. Ve a Settings → Environment Variables
2. Agrega: `VITE_API_BASE_URL` = `https://api.tudominio.com/api`

**Netlify:**
1. Ve a Site settings → Environment variables
2. Agrega: `VITE_API_BASE_URL` = `https://api.tudominio.com/api`

## Estructura Recomendada

```
PrevioMX_Web/
├── .env                    # NO se commitea (opcional, fallback)
├── .env.development        # NO se commitea (desarrollo)
├── .env.production         # NO se commitea (producción)
├── .env.example            # SÍ se commitea (plantilla)
└── .gitignore              # Ignora .env*
```

## Verificar la Configuración

Al ejecutar `npm run dev`, verás en la consola del navegador:

```
🔧 API Config: {
  BASE_URL: "http://localhost:5000/api",
  TIMEOUT: 30000,
  ENV: "development"
}
```

## Reglas Importantes

1. ✅ **SÍ se commitea**: `.env.example` (plantilla)
2. ❌ **NO se commitea**: `.env`, `.env.local`, `.env.development`, `.env.production`
3. 🔒 **Seguridad**: Nunca pongas URLs de producción con credenciales en el código
4. 🔄 **Reiniciar**: Si cambias `.env`, reinicia el servidor (`npm run dev`)

## Ejemplos por Escenario

### Desarrollo Local
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Staging/QA
```env
VITE_API_BASE_URL=https://staging-api.previo.com/api
```

### Producción
```env
VITE_API_BASE_URL=https://api.previo.com/api
```

## Troubleshooting

**Problema**: La variable no se está leyendo
- ✅ Verifica que el nombre empiece con `VITE_`
- ✅ Reinicia el servidor después de cambiar `.env`
- ✅ Verifica que el archivo esté en la raíz del proyecto
- ✅ Revisa la consola del navegador para ver qué valor se está usando

**Problema**: Diferentes valores en dev y prod
- ✅ Usa `.env.development` y `.env.production` separados
- ✅ O configura variables en tu plataforma de deployment

