# PrevioMX Web

Aplicación web desarrollada en React + JavaScript para conectar con la API .NET Core de PrevioMX.

## Características

- ✅ Autenticación JWT
- ✅ Arquitectura separada (vistas, componentes, servicios, estilos)
- ✅ Rutas protegidas
- ✅ Interceptores de Axios para manejo de tokens
- ✅ Context API para gestión de estado de autenticación

## Estructura del Proyecto

```
PrevioMX_Web/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── auth/           # Componentes de autenticación
│   │   ├── common/         # Componentes comunes (Loading, etc.)
│   │   └── layout/         # Componentes de layout (Header, etc.)
│   ├── config/             # Configuraciones
│   ├── contexts/           # Context API (AuthContext)
│   ├── routes/             # Configuración de rutas
│   ├── services/           # Servicios de API
│   ├── styles/             # Estilos globales
│   └── views/              # Vistas/páginas
├── package.json
├── vite.config.js
└── README.md
```

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:

   **Opción A: Archivo único `.env` (recomendado para empezar)**
   ```bash
   # Crear archivo .env en la raíz del proyecto
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

   **Opción B: Archivos específicos por ambiente (recomendado para producción)**
   
   Para desarrollo, crear `.env.development`:
   ```bash
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
   
   Para producción, crear `.env.production`:
   ```bash
   VITE_API_BASE_URL=https://api.tudominio.com/api
   ```

   > **Nota**: Los archivos `.env` NO se commitean al repositorio (están en `.gitignore`). 
   > Vite carga automáticamente `.env.development` en `npm run dev` y `.env.production` en `npm run build`.

## Desarrollo

Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Build

Generar build de producción:
```bash
npm run build
```

**Importante para producción:**
- Asegúrate de tener `.env.production` configurado con la URL correcta de tu API
- O configura las variables de entorno en tu plataforma de deployment (Vercel, Netlify, etc.)
- El build incluirá las variables del `.env.production` en el código compilado

## Autenticación

La aplicación utiliza JWT para autenticación. El token se almacena en `localStorage` y se incluye automáticamente en todas las peticiones mediante interceptores de Axios.

### Endpoints esperados en la API:

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/refresh` - Refrescar token

### Formato de respuesta esperado:

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Usuario"
  }
}
```

## Estructura de Archivos

- **Vistas**: Cada vista tiene su propio archivo JSX y CSS
- **Componentes**: Separados por funcionalidad (auth, layout, common)
- **Servicios**: Lógica de negocio y comunicación con API
- **Contextos**: Estado global de la aplicación
- **Estilos**: CSS separado por componente/vista

