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
  const isFormData = data instanceof FormData
  return axiosInstance.post('/admin/agents', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
}

export function updateAgent(userId, data) {
  const isFormData = data instanceof FormData
  return axiosInstance.put(`/admin/agents/${userId}`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
}

export function deleteAgent(userId) {
  return axiosInstance.delete(`/admin/agents/${userId}`)
}

export function getAnalytics(params) {
  return axiosInstance.get('/admin/analytics', { params })
}

// Legacy exports for compatibility with existing components
export function listUsers(params) {
  return axiosInstance.get('/admin/users', { params })
}

export function updateAdminUser(userId, body) {
  return axiosInstance.put(`/admin/users/${userId}`, body)
}

export function uploadAdminProfileImage(userId, file) {
  const formData = new FormData()
  formData.append('profileImage', file)
  return axiosInstance.post(`/admin/users/${userId}/profile-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function listCustomers(params) {
  return axiosInstance.get('/admin/customers/detailed', { params })
}

export function getCustomer(customerId) {
  return axiosInstance.get(`/admin/customers/${customerId}`)
}

export function updateCustomer(customerId, body) {
  return axiosInstance.put(`/admin/customers/${customerId}`, body)
}

export function uploadCustomerProfileImage(customerId, file) {
  const formData = new FormData()
  formData.append('profileImage', file)
  return axiosInstance.post(`/admin/customers/${customerId}/profile-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
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
  const isFormData = data instanceof FormData
  return axiosInstance.post('/notifications/send', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
}

export function getSentNotifications() {
  return axiosInstance.get('/notifications/sent')
}

export function getNotificationPreview(id) {
  return axiosInstance.get(`/notifications/${id}/preview`)
}

export function getReports(params) {
  return axiosInstance.get('/admin/reports', { params })
}

export function listAllVendors(params) {
  return axiosInstance.get('/admin/vendors', { params })
}

export function getVendorDetail(id) {
  return axiosInstance.get(`/admin/vendors/${id}`)
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
  uploadAdminProfileImage,
  createAgent,
  updateAgent,
  deleteAgent,
  listCustomers,
  getCustomer,
  updateCustomer,
  uploadCustomerProfileImage,
  listPackages,
  listWhitelabelsByPackage,
  listBookingsByPackage,
  listWhitelabelsByAgent,
  getAgent,
  getAgencyCustomers: (id) => axiosInstance.get(`/admin/agents/${id}/customers`),
  getCustomerBookings: (id) => axiosInstance.get(`/admin/customers/${id}/bookings`),
  getAgentHierarchy: (id) => axiosInstance.get(`/admin/agents/${id}/hierarchy`),
  getPackageHierarchy: (id) => axiosInstance.get(`/admin/packages/${id}/hierarchy`),
  approvePackage: (id) => axiosInstance.patch(`/admin/packages/approve/${id}`),
  rejectPackage: (id, rejectionReason) => axiosInstance.patch(`/admin/packages/reject/${id}`, { rejectionReason }),
  togglePackageSuspension: (id) => axiosInstance.patch(`/admin/packages/toggle-suspension/${id}`),
  getNotificationRecipients,
  sendNotification,
  getSentNotifications,
  getNotificationPreview,
  getReports,
  syncBookingStatus: () => axiosInstance.post('/admin/bookings/sync-status'),
  listAllBookings: (params) => axiosInstance.get('/admin/bookings', { params }),
  getBookingDetail: (id) => axiosInstance.get(`/admin/bookings/${id}`),
  getOtpLogs: (params) => axiosInstance.get('/admin/otp-logs', { params }),
  listAllVendors,
  getVendorDetail,
}

export const getAgentHierarchy = (id) => axiosInstance.get(`/admin/agents/${id}/hierarchy`);
export const getPackageHierarchy = (id) => axiosInstance.get(`/admin/packages/${id}/hierarchy`);

export default adminApi
