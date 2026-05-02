import axiosInstance from '@/shared/services/axiosInstance.js'

export function listChildAgencies(params = {}) {
  return axiosInstance.get('/parent-agent/children', { params })
}

export function getChildAgent(id) {
  return axiosInstance.get(`/parent-agent/children/${id}`)
}

export function toggleChildAgentStatus(id) {
  return axiosInstance.patch(`/parent-agent/children/${id}/toggle-status`)
}

export function approveChildKyc(id) {
  return axiosInstance.patch(`/parent-agent/children/${id}/approve-kyc`)
}

export function listPendingRequests() {
  return axiosInstance.get('/parent-agent/pending-requests')
}

export function approveParentRequest(id) {
  return axiosInstance.patch(`/parent-agent/pending-requests/${id}/approve`)
}

export function rejectParentRequest(id) {
  return axiosInstance.delete(`/parent-agent/pending-requests/${id}`)
}

// Packages
export function createPackage(formData) {
  return axiosInstance.post('/parent-agent/packages', formData)
}

export function listMyPackages() {
  return axiosInstance.get('/parent-agent/packages')
}

export function getPackageById(id) {
  return axiosInstance.get(`/parent-agent/packages/${id}`)
}

export function updatePackage(id, data) {
  return axiosInstance.patch(`/parent-agent/packages/${id}`, data)
}

export function updatePackageCover(id, formData) {
  return axiosInstance.patch(`/parent-agent/packages/${id}/cover`, formData)
}

export function updatePackageGallery(id, formData) {
  return axiosInstance.patch(`/parent-agent/packages/${id}/gallery`, formData)
}

export function deactivatePackage(id) {
  return axiosInstance.delete(`/parent-agent/packages/${id}`)
}

export function activatePackage(id) {
  return axiosInstance.patch(`/parent-agent/packages/${id}/activate`)
}

export function softDeletePackage(id) {
  return axiosInstance.delete(`/parent-agent/packages/${id}/soft-delete`)
}

export function uploadEventImage(formData) {
  return axiosInstance.post('/parent-agent/packages/event-image', formData)
}

// Vendors
export function listVendors(params = {}) {
  return axiosInstance.get('/parent-agent/vendors', { params })
}

export function getVendor(id) {
  return axiosInstance.get(`/parent-agent/vendors/${id}`)
}

export function createVendor(formData) {
  return axiosInstance.post('/parent-agent/vendors', formData)
}

export function updateVendor(id, data) {
  return axiosInstance.put(`/parent-agent/vendors/${id}`, data)
}

export function deleteVendor(id) {
  return axiosInstance.delete(`/parent-agent/vendors/${id}`)
}

export default {
  listChildAgencies,
  createPackage,
  listMyPackages,
  getPackageById,
  updatePackage,
  updatePackageCover,
  updatePackageGallery,
  deactivatePackage,
}

// Bookings
export function listBookings(params = {}) {
  return axiosInstance.get('/parent-agent/bookings', { params })
}

export function getBooking(id) {
  return axiosInstance.get(`/parent-agent/bookings/${id}`)
}

export function createBooking(data) {
  return axiosInstance.post('/parent-agent/bookings', data)
}

export function listCustomers(params = {}) {
  return axiosInstance.get('/parent-agent/customers', { params })
}

export function getCustomerByPhone(phone) {
  return axiosInstance.get('/parent-agent/customers/by-phone', { params: { phone } })
}

export function updateAgencyCustomer(id, data) {
  return axiosInstance.patch(`/parent-agent/customers/${id}`, data)
}

export function toggleAgencyCustomerActive(id) {
  return axiosInstance.patch(`/parent-agent/customers/${id}/toggle-status`)
}

export function updateBooking(id, data) {
  return axiosInstance.patch(`/parent-agent/bookings/${id}`, data)
}

// Settings
export function getProfile() {
  return axiosInstance.get('/parent-agent/profile')
}

export function updateProfile(data) {
  return axiosInstance.patch('/parent-agent/profile', data)
}

export function changePassword(data) {
  return axiosInstance.patch('/parent-agent/change-password', data)
}

// Notifications (parent-scoped, reuse global notification endpoints)
export function sendNotification(data) {
  // data: { users: string[], customers: string[], subject: string, message: string }
  return axiosInstance.post('/notifications/send', data)
}

export function getSentNotifications() {
  return axiosInstance.get('/notifications/sent')
}
// Analytics
export function getAnalytics(params) {
  return axiosInstance.get('/parent-agent/analytics', { params })
}

// Booking Tickets
export function uploadBookingTickets(id, formData) {
  return axiosInstance.post(`/parent-agent/bookings/${id}/tickets`, formData)
}

export function deleteBookingTicket(id, ticketId) {
  return axiosInstance.delete(`/parent-agent/bookings/${id}/tickets/${ticketId}`)
}

export function updateKyc(formData) {
  return axiosInstance.patch('/parent-agent/kyc', formData)
}
