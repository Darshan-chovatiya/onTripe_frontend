import axiosInstance from '@/shared/services/axiosInstance.js'

export function listBookings(params) {
  return axiosInstance.get('/agency/child/bookings', { params })
}

export default { listBookings }
