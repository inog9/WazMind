import axios from 'axios'
import { API_BASE_URL } from '../constants/api'

/**
 * Retry configuration
 */
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

/**
 * Create axios instance with default config
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
})

/**
 * Retry mechanism for failed requests
 */
async function retryRequest(config, retryCount = 0) {
  try {
    return await api.request(config)
  } catch (error) {
    // Only retry on network errors or 5xx errors
    const shouldRetry = 
      !error.response || // Network error
      (error.response.status >= 500 && error.response.status < 600) // Server error
    
    if (shouldRetry && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount) // Exponential backoff
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryRequest(config, retryCount + 1)
    }
    
    throw error
  }
}

/**
 * API methods with retry mechanism
 */
export const apiClient = {
  get: async (url, config = {}) => {
    return retryRequest({ ...config, method: 'get', url })
  },
  
  post: async (url, data, config = {}) => {
    return retryRequest({ ...config, method: 'post', url, data })
  },
  
  put: async (url, data, config = {}) => {
    return retryRequest({ ...config, method: 'put', url, data })
  },
  
  delete: async (url, config = {}) => {
    return retryRequest({ ...config, method: 'delete', url })
  },
  
  patch: async (url, data, config = {}) => {
    return retryRequest({ ...config, method: 'patch', url, data })
  },
}

export default api

