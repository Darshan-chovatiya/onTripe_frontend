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

const adminApi = {
  listAgents,
  listPendingKyc,
  approveKyc,
  rejectKyc,
  toggleAgent,
  getAnalytics,
  listUsers,
  updateAdminUser
}

export default adminApi


