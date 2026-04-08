import axiosInstance from '@/shared/services/axiosInstance.js'

export function getAnalytics() {
  return axiosInstance.get('/sub-child-agent/analytics')
}

export function listMyBookings() {
  return axiosInstance.get('/sub-child-agent/bookings')
}

export function createBooking(formData) {
  return axiosInstance.post('/sub-child-agent/bookings', formData)
}

export function listAvailableWhitelabels() {
  return axiosInstance.get('/sub-child-agent/whitelabels/available')
}

export function listMyWhitelabels() {
  return axiosInstance.get('/sub-child-agent/whitelabels')
}

export function createWhitelabel(body) {
  return axiosInstance.post('/sub-child-agent/whitelabels', body)
}

export function updateWhitelabel(id, body) {
  return axiosInstance.patch(`/sub-child-agent/whitelabels/${id}`, body)
}

export function listCustomers() {
  return axiosInstance.get('/sub-child-agent/customers')
}

export function getCustomerByPhone(phone) {
  return axiosInstance.get('/sub-child-agent/customers/by-phone', { params: { phone } })
}

export function updateAgencyCustomer(id, body) {
  return axiosInstance.patch(`/sub-child-agent/customers/${id}`, body)
}

export function toggleAgencyCustomerActive(id) {
  return axiosInstance.patch(`/sub-child-agent/customers/${id}/toggle-active`)
}

export function getSubChildProfile() {
  return axiosInstance.get('/sub-child-agent/profile')
}

export function updateSubChildProfile(body) {
  return axiosInstance.patch('/sub-child-agent/profile', body)
}

export function changeSubChildPassword(body) {
  return axiosInstance.post('/sub-child-agent/change-password', body)
}

export default {
  listMyBookings,
  createBooking,
  listAvailableWhitelabels,
  listMyWhitelabels,
  createWhitelabel,
  updateWhitelabel,
  listCustomers,
  getCustomerByPhone,
  updateAgencyCustomer,
  toggleAgencyCustomerActive,
  getSubChildProfile,
  updateSubChildProfile,
  changeSubChildPassword,
}
