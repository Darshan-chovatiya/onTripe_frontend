import axiosInstance from '@/shared/services/axiosInstance.js'

/** Admin-scoped API — add endpoints as backend grows */
export function listUsers(params) {
  return axiosInstance.get('/admin/users', { params })
}

export function updateAdminUser(userId, body) {
  return axiosInstance.put(`/admin/users/${userId}`, body)
}

export function getDashboardSummary() {
  return axiosInstance.get('/admin/dashboard').catch(() => ({ data: { status: 200, result: null } }))
}

const adminApi = { listUsers, updateAdminUser, getDashboardSummary }
export default adminApi
