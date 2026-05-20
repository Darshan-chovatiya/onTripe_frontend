import axios from 'axios'
import {
  AUTH_SCOPES,
  clearStoredSession,
  getScopeForApiUrl,
  readStoredToken,
} from '@/shared/utils/authStorage.js'
import { getLoginPathForCurrentPath } from '@/shared/utils/roleHelpers.js'

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

axiosInstance.interceptors.request.use(
  (config) => {
    const url = config.url || ''
    const scope = config.authScope || getScopeForApiUrl(url)
    config.authScope = scope

    const headerToken = config.headers?.Authorization
    if (headerToken && String(headerToken).startsWith('Bearer ')) {
      return config
    }

    const token = readStoredToken(scope)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
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
    const scope = error.config?.authScope || getScopeForApiUrl(url)

    const isAuthUrl =
      url.includes('/auth/admin/login') ||
      url.includes('/auth/organizer/login') ||
      url.includes('/auth/login') ||
      url.includes('/auth/send-otp') ||
      url.includes('/auth/verify-otp') ||
      url.includes('/auth/otp/')

    const isStaleSession =
      status === 401 ||
      (status === 404 && message.toLowerCase().includes('user not found'))

    if (isStaleSession && !isAuthUrl) {
      clearStoredSession(scope)

      const hashPath = window.location.hash.replace(/^#/, '') || '/'
      const loginPath = getLoginPathForCurrentPath(hashPath)
      const onLoginPage =
        hashPath.startsWith('/login') ||
        hashPath.startsWith('/customer/login') ||
        hashPath.startsWith('/vendor/login')

      if (!onLoginPage) {
        if (scope === AUTH_SCOPES.CUSTOMER) {
          window.location.hash = '#/customer/login'
        } else if (scope === AUTH_SCOPES.VENDOR) {
          window.location.hash = '#/vendor/login'
        } else {
          window.location.hash = `#${loginPath}`
        }
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
