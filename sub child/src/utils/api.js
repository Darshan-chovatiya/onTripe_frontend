import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const parsed = JSON.parse(token)
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`
        }
      } catch (e) {
        console.error('Error parsing token:', e)
      }
    }
    // Don't override Content-Type if it's FormData (for file uploads)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on login endpoint - let the Login component handle the error
      const isLoginRequest = error.config?.url?.includes('/auth/organizer/login') ||
                            error.config?.url?.includes('/auth/admin/login')

      if (!isLoginRequest) {
        localStorage.removeItem('auth-storage')
        const basePath = import.meta.env.BASE_URL || '/organizer/'
        window.location.href = `${basePath}#/login`
      }
    }
    return Promise.reject(error)
  }
)

export default api
