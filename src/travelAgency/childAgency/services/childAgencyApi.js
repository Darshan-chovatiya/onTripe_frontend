import axiosInstance from '@/shared/services/axiosInstance.js'

export function getAnalytics(params) {
  return axiosInstance.get('/child-agent/analytics', { params })
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

export function listAvailableWhitelabels() {
  return axiosInstance.get('/child-agent/whitelabels/available')
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

export function listSubChildren(params) {
  return axiosInstance.get('/child-agent/sub-children', { params })
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

export function rejectSubChildKyc(id, rejectionReason) {
  return axiosInstance.patch(`/child-agent/sub-children/${id}/reject-kyc`, { status: 'rejected', rejectionReason })
}

export function createSubChild(formData) {
  return axiosInstance.post('/child-agent/sub-children', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateSubChildAgent(id, formData) {
  return axiosInstance.patch(`/child-agent/sub-children/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function listPendingRequests() {
  return axiosInstance.get('/child-agent/pending-requests')
}

export function approveParentRequest(id) {
  return axiosInstance.patch(`/child-agent/pending-requests/${id}/approve`)
}

export function rejectParentRequest(id) {
  return axiosInstance.delete(`/child-agent/pending-requests/${id}`)
}

export function listParents() {
  return axiosInstance.get('/child-agent/parents')
}

export function addParent(parentCode) {
  return axiosInstance.post('/child-agent/parents', { parentCode })
}

export function removeParent(parentId) {
  return axiosInstance.delete(`/child-agent/parents/${parentId}`)
}

export function toggleParentActive(parentId) {
  return axiosInstance.patch(`/child-agent/parents/${parentId}/toggle-active`)
}

export function getChildProfile() {
  return axiosInstance.get('/child-agent/profile')
}

export function updateChildProfile(body) {
  const isFormData = body instanceof FormData
  return axiosInstance.patch('/child-agent/profile', body, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
}

export function changeChildPassword(body) {
  return axiosInstance.post('/child-agent/change-password', body)
}

export function listCustomers(params) {
  return axiosInstance.get('/child-agent/customers', { params })
}

export function getCustomerByPhone(phone) {
  return axiosInstance.get('/child-agent/customers/by-phone', { params: { phone } })
}

export function updateAgencyCustomer(id, body) {
  return axiosInstance.patch(`/child-agent/customers/${id}`, body)
}

export function toggleAgencyCustomerActive(id) {
  return axiosInstance.patch(`/child-agent/customers/${id}/toggle-active`)
}

export function createAgencyCustomer(body) {
  return axiosInstance.post('/child-agent/customers', body)
}

export function importAgencyCustomers(customers) {
  return axiosInstance.post('/child-agent/customers/import', { customers })
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
  updateAgencyCustomer,
  toggleAgencyCustomerActive,
  sendNotification,
  getSentNotifications,
  getNotificationPreview,
}

export function updateChildKyc(formData) {
  return axiosInstance.patch('/child-agent/kyc', formData)
}

export function getEarnings(params = {}) {
  return axiosInstance.get('/child-agent/earnings', { params })
}
