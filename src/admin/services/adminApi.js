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

export function listPackages(params) {
  return axiosInstance.get('/admin/packages', { params })
}

export function getAgent(id) {
  return axiosInstance.get(`/admin/agents/${id}`)
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
  listPackages,
  listWhitelabelPackages: (params) => axiosInstance.get('/admin/whitelabels', { params }),
  getAgent,
  getAgencyCustomers: (id) => axiosInstance.get(`/admin/agents/${id}/customers`),
  approvePackage: (id) => axiosInstance.patch(`/admin/packages/approve/${id}`),
  rejectPackage: (id, rejectionReason) => axiosInstance.patch(`/admin/packages/reject/${id}`, { rejectionReason })
}

export default adminApi


