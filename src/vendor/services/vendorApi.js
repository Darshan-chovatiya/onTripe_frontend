import axiosInstance from '@/shared/services/axiosInstance.js'

export function getVendorProfile() {
  return axiosInstance.get('/vendor/me')
}

export function getVendorSchedule(params = {}) {
  return axiosInstance.get('/vendor/schedule', { params })
}

export default {
  getVendorProfile,
  getVendorSchedule,
}

