import axiosInstance from '@/shared/services/axiosInstance.js'

export function getCustomerProfile() {
  return axiosInstance.get('/customer/me')
}

export function updateCustomerProfile(body) {
  return axiosInstance.put('/customer/profile', body)
}

export function getVendorChatMessages(bookingId, vendorId) {
  return axiosInstance.get(`/customer/bookings/${bookingId}/chat/${vendorId}`)
}

export function sendVendorChatMessage(bookingId, vendorId, formData) {
  return axiosInstance.post(`/customer/bookings/${bookingId}/chat/${vendorId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export default { getCustomerProfile, updateCustomerProfile, getVendorChatMessages, sendVendorChatMessage }
