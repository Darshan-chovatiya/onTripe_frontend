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

export function getCustomerNotifications(params = {}) {
  return axiosInstance.get('/customer/notifications', { params })
}

export function getCustomerUnreadCount() {
  return axiosInstance.get('/customer/notifications/unread-count')
}

export function markCustomerNotificationRead(id) {
  return axiosInstance.patch(`/customer/notifications/${id}/read`)
}

export function markAllCustomerNotificationsRead() {
  return axiosInstance.patch('/customer/notifications/read-all')
}

export default {
  getCustomerProfile,
  updateCustomerProfile,
  getVendorChatMessages,
  sendVendorChatMessage,
  getCustomerNotifications,
  getCustomerUnreadCount,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
}
