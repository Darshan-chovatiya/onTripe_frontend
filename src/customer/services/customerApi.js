import axiosInstance from '@/shared/services/axiosInstance.js'

export function getCustomerProfile() {
  return axiosInstance.get('/customer/me')
}

export function updateCustomerProfile(body) {
  return axiosInstance.put('/customer/profile', body)
}

export default { getCustomerProfile, updateCustomerProfile }
