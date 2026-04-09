import axiosInstance from '@/shared/services/axiosInstance.js'

/** Admin-scoped API */
export function listAgents(params) {
  return axiosInstance.get('/admin/agents', { params })
}

export function listPendingKyc() {
  return axiosInstance.get('/admin/kyc/pending')
}

export function approveKyc(userId, data = {}) {
  return axiosInstance.patch(`/admin/kyc/approve/${userId}`, { ...data, status: 'approved' })
}

export function rejectKyc(userId, rejectionReason) {
  return axiosInstance.patch(`/admin/kyc/reject/${userId}`, { status: 'rejected', rejectionReason })
}

export function toggleAgent(userId) {
  return axiosInstance.patch(`/admin/agents/toggle/${userId}`)
}

export function createAgent(data) {
  return axiosInstance.post('/admin/agents', data)
}

export function updateAgent(userId, data) {
  return axiosInstance.put(`/admin/agents/${userId}`, data)
}

export function deleteAgent(userId) {
  return axiosInstance.delete(`/admin/agents/${userId}`)
}

export function getAnalytics() {
  return axiosInstance.get('/admin/analytics')
}

// Legacy exports for compatibility with existing components
export function listUsers(params) {
  return axiosInstance.get('/admin/users', { params })
}

export function updateAdminUser(userId, body) {
  return axiosInstance.put(`/admin/users/${userId}`, body)
}

export function listCustomers(params) {
  return axiosInstance.get('/admin/customers/detailed', { params })
}

export function getCustomer(customerId) {
  return axiosInstance.get(`/admin/customers/${customerId}`)
}

export function listPackages(params) {
  return axiosInstance.get('/admin/packages', { params })
}

export function listWhitelabelsByPackage(packageId) {
  return axiosInstance.get(`/admin/packages/${packageId}/whitelabels`)
}

export function listBookingsByPackage(packageId, params) {
  return axiosInstance.get(`/admin/packages/${packageId}/bookings`, { params })
}

export function listWhitelabelsByAgent(agentId) {
  return axiosInstance.get(`/admin/agents/${agentId}/whitelabels`)
}

export function getAgent(id) {
  return axiosInstance.get(`/admin/agents/${id}`)
}

export function getNotificationRecipients() {
  return axiosInstance.get('/admin/notifications/recipients')
}

export function sendNotification(data) {
  return axiosInstance.post('/notifications/send', data)
}

export function getSentNotifications() {
  return axiosInstance.get('/notifications/sent')
}

const adminApi = {
  listAgents,
  listPendingKyc,
  approveKyc,
  rejectKyc,
  toggleAgent,
  getAnalytics,
  listUsers,
  updateAdminUser,
  createAgent,
  updateAgent,
  deleteAgent,
  listCustomers,
  getCustomer,
  listPackages,
  listWhitelabelsByPackage,
  listBookingsByPackage,
  listWhitelabelsByAgent,
  getAgent,
  getAgencyCustomers: (id) => axiosInstance.get(`/admin/agents/${id}/customers`),
  approvePackage: (id) => axiosInstance.patch(`/admin/packages/approve/${id}`),
  rejectPackage: (id, rejectionReason) => axiosInstance.patch(`/admin/packages/reject/${id}`, { rejectionReason }),
  getNotificationRecipients,
  sendNotification,
  getSentNotifications
}

export default adminApi
