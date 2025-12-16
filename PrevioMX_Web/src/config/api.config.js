const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  
  if (envUrl) {
    return envUrl
  }
  
  return 'https://zelma-disturbed-robbyn.ngrok-free.dev'
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



