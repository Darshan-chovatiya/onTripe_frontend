import axiosInstance from '@/shared/services/axiosInstance.js'

export function getVendorProfile() {
  return axiosInstance.get('/vendor/me')
}

export function getVendorSchedule(params = {}) {
  return axiosInstance.get('/vendor/schedule', { params })
}

export function getCustomerChatMessages(bookingId, customerId) {
  return axiosInstance.get(`/vendor/chat/${bookingId}?customerId=${customerId}`)
}

export function sendCustomerChatMessage(bookingId, formData) {
  return axiosInstance.post(`/vendor/chat/${bookingId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export default {
  getVendorProfile,
  getVendorSchedule,
  getCustomerChatMessages,
  sendCustomerChatMessage,
}

