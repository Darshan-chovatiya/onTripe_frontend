import axiosInstance from '@/shared/services/axiosInstance.js'

/** Shared travel-agency API helpers (parent / child / sub only). */
export function getAgencyProfile() {
  return axiosInstance.get('/agency/me')
}

export default axiosInstance
