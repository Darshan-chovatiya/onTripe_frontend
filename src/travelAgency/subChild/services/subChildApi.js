import axiosInstance from '@/shared/services/axiosInstance.js'

export function getAnalytics() {
  return axiosInstance.get('/sub-child-agent/analytics')
}

export function listMyBookings(params) {
  return axiosInstance.get('/sub-child-agent/bookings', { params })
}

export function createBooking(formData) {
  return axiosInstance.post('/sub-child-agent/bookings', formData)
}

export function getBooking(id) {
  return axiosInstance.get(`/sub-child-agent/bookings/${id}`)
}

export function updateBooking(id, formData) {
  return axiosInstance.patch(`/sub-child-agent/bookings/${id}`, formData)
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

export function listCustomers(params) {
  return axiosInstance.get('/sub-child-agent/customers', { params })
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

export function listParents() {
  return axiosInstance.get('/sub-child-agent/parents')
}

export function addParent(parentCode) {
  return axiosInstance.post('/sub-child-agent/parents', { parentCode })
}

export function removeParent(parentId) {
  return axiosInstance.delete(`/sub-child-agent/parents/${parentId}`)
}

export function toggleParentActive(parentId) {
  return axiosInstance.patch(`/sub-child-agent/parents/${parentId}/toggle-active`)
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
  getBooking,
  updateBooking,
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

export function updateSubChildKyc(formData) {
  return axiosInstance.patch('/sub-child-agent/kyc', formData)
}
