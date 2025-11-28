/**
 * Configuración de la API
 * 
 * Ventajas de este enfoque (Variables de entorno + archivo de configuración):
 * 
 * 1. Variables de entorno (.env):
 *    - Diferentes configuraciones para dev/staging/prod sin cambiar código
 *    - No se commitea al repositorio (seguridad)
 *    - Fácil de cambiar en deployment
 * 
 * 2. Archivo de configuración (api.config.js):
 *    - Centraliza toda la configuración en un solo lugar
 *    - Valores por defecto si no hay .env
 *    - Validación y transformación de valores
 *    - Fácil de encontrar y mantener
 *    - Type safety y autocompletado en el IDE
 */

// Detectar el ambiente
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// Obtener la URL base de la API desde variables de entorno o usar valor por defecto
const getBaseUrl = () => {
  // Prioridad: Variable de entorno > Valor por defecto según ambiente
  const envUrl = import.meta.env.VITE_API_BASE_URL
  
  if (envUrl) {
    return envUrl
  }
  
  // Valores por defecto según el ambiente
  if (isDevelopment) {
    return 'http://localhost:5000/api'
  }
  
  // En producción, debería venir del .env, pero por si acaso:
  return '/api'
}

// Validar que la URL sea válida
const baseUrl = getBaseUrl()
if (!baseUrl) {
  console.warn('⚠️ VITE_API_BASE_URL no está configurada')
}

export const API_CONFIG = {
  BASE_URL: baseUrl,
  TIMEOUT: 30000, // 30 segundos
  // Otros valores de configuración pueden ir aquí
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
}

// Validación en desarrollo
if (isDevelopment) {
  console.log('🔧 API Config:', {
    BASE_URL: API_CONFIG.BASE_URL,
    TIMEOUT: API_CONFIG.TIMEOUT,
    ENV: import.meta.env.MODE
  })
}

