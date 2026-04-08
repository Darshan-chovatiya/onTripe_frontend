import axiosInstance from '@/shared/services/axiosInstance.js'

export function getAnalytics() {
  return axiosInstance.get('/child-agent/analytics')
}

export function listBookings(params) {
  return axiosInstance.get('/child-agent/bookings', { params })
}

/** @param {FormData} formData */
export function createBooking(formData) {
  return axiosInstance.post('/child-agent/bookings', formData)
}

export function getBooking(id) {
  return axiosInstance.get(`/child-agent/bookings/${id}`)
}

export function updateBooking(id, body) {
  return axiosInstance.patch(`/child-agent/bookings/${id}`, body)
}

export function listAvailablePackages() {
  return axiosInstance.get('/child-agent/packages/available')
}

export function listMyWhitelabels() {
  return axiosInstance.get('/child-agent/whitelabels')
}

export function createWhitelabel(body) {
  return axiosInstance.post('/child-agent/whitelabels', body)
}

export function updateWhitelabel(id, body) {
  return axiosInstance.patch(`/child-agent/whitelabels/${id}`, body)
}

export function listSubChildren() {
  return axiosInstance.get('/child-agent/sub-children')
}

export function getSubChild(id) {
  return axiosInstance.get(`/child-agent/sub-children/${id}`)
}

export function updateSubChild(id, body) {
  return axiosInstance.patch(`/child-agent/sub-children/${id}`, body)
}

export function approveSubChildKyc(id) {
  return axiosInstance.patch(`/child-agent/sub-children/${id}/approve-kyc`)
}

export function getChildProfile() {
  return axiosInstance.get('/child-agent/profile')
}

export function updateChildProfile(body) {
  return axiosInstance.patch('/child-agent/profile', body)
}

export function changeChildPassword(body) {
  return axiosInstance.post('/child-agent/change-password', body)
}

export function listCustomers() {
  return axiosInstance.get('/child-agent/customers')
}

export function getCustomerByPhone(phone) {
  return axiosInstance.get('/child-agent/customers/by-phone', { params: { phone } })
}

// Notifications (reuse global notification endpoints)
export function sendNotification(data) {
  return axiosInstance.post('/notifications/send', data)
}

export function getSentNotifications() {
  return axiosInstance.get('/notifications/sent')
}

export function getNotificationPreview(id) {
  return axiosInstance.get(`/notifications/${id}/preview`)
}

export default {
  listBookings,
  createBooking,
  getBooking,
  updateBooking,
  listAvailablePackages,
  listMyWhitelabels,
  createWhitelabel,
  updateWhitelabel,
  listSubChildren,
  getSubChild,
  updateSubChild,
  getChildProfile,
  updateChildProfile,
  changeChildPassword,
  listCustomers,
  getCustomerByPhone,
  sendNotification,
  getSentNotifications,
  getNotificationPreview,
}
