import api from '@/shared/services/axiosInstance.js'

export const getOtpLogs = async ({ page = 1, limit = 20, search = '' }) => {
  const response = await api.get('/admin/otp-logs', {
    params: { page, limit, search }
  })
  return response.data
}
