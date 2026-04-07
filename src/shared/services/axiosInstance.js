import axios from 'axios'
import { AUTH_STORAGE_KEY } from '@/shared/utils/constants.js'

function getApiBaseURL() {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (!envUrl || envUrl.includes('VITE_API_BASE_URL')) {
    return 'http://localhost:5001/api'
  }
  let baseURL = envUrl.trim()
  if (!baseURL.endsWith('/api')) {
    baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`
  }
  return baseURL.replace(/([^:]\/)\/+/g, '$1')
}

const axiosInstance = axios.create({
  baseURL: getApiBaseURL(),
  headers: { 'Content-Type': 'application/json' },
})

function readStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token ?? null
  } catch {
    return null
  }
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = readStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      // Let the browser set the correct multipart/form-data boundary
      config.headers = { ...config.headers }
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || ''
    const url = error.config?.url || ''

    const isAuthUrl =
      url.includes('/auth/admin/login') ||
      url.includes('/auth/organizer/login') ||
      url.includes('/auth/login') ||
      url.includes('/auth/send-otp') ||
      url.includes('/auth/verify-otp')

    const isStaleSession =
      (status === 401) ||
      (status === 404 && message.toLowerCase().includes('user not found'))

    if (isStaleSession && !isAuthUrl) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
