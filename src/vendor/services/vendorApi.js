import axiosInstance from '@/shared/services/axiosInstance.js'

export function getVendorProfile() {
  return axiosInstance.get('/vendor/me')
}

export function updateVendorProfile(data) {
  return axiosInstance.put('/vendor/me', data)
}

export function getVendorSchedule(params = {}) {
  return axiosInstance.get('/vendor/schedule', { params })
}

export function getAllCustomerChats() {
  return axiosInstance.get('/vendor/customer-chats')
}

export function getCustomerChatMessages(bookingId, customerId) {
  return axiosInstance.get(`/vendor/chat/${bookingId}?customerId=${customerId}`)
}

export function sendCustomerChatMessage(bookingId, formData) {
  return axiosInstance.post(`/vendor/chat/${bookingId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getVendorCommunities() {
  return axiosInstance.get('/vendor/communities')
}

export function getVendorNotifications(params = {}) {
  return axiosInstance.get('/vendor/notifications', { params })
}

export function getVendorUnreadCount() {
  return axiosInstance.get('/vendor/notifications/unread-count')
}

export function markVendorNotificationRead(id) {
  return axiosInstance.patch(`/vendor/notifications/${id}/read`)
}

export function markAllVendorNotificationsRead() {
  return axiosInstance.patch('/vendor/notifications/read-all')
}

export function getAgentChatMessages() {
  return axiosInstance.get('/vendor/chat-agent')
}

export function sendAgentChatMessage(formData) {
  return axiosInstance.post('/vendor/chat-agent', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default {
  getVendorProfile,
  updateVendorProfile,
  getVendorSchedule,
  getAllCustomerChats,
  getCustomerChatMessages,
  sendCustomerChatMessage,
  getVendorCommunities,
  getVendorNotifications,
  getVendorUnreadCount,
  markVendorNotificationRead,
  markAllVendorNotificationsRead,
  getAgentChatMessages,
  sendAgentChatMessage,
}
