const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  
  if (envUrl) {
    return envUrl
  }
  
  // En desarrollo local, usar el puerto del API .NET
  if (isDevelopment) {
    return 'https://localhost:5001'
  }
  
  return 'http://192.168.6.185/PrevioMX/Api'
}

const baseUrl = getBaseUrl()
if (!baseUrl) {
  console.warn('⚠️ VITE_API_BASE_URL no está configurada')
}

export const API_CONFIG = {
  BASE_URL: baseUrl,
  TIMEOUT: 30000, 
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
}



