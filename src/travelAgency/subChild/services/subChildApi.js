import axiosInstance from '@/shared/services/axiosInstance.js'

export function listMyBookings() {
  return axiosInstance.get('/agency/sub/bookings')
}

export default { listMyBookings }
