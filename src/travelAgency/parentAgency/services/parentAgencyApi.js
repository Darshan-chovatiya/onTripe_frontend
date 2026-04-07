import axiosInstance from '@/shared/services/axiosInstance.js'

export function listChildAgencies() {
  return axiosInstance.get('/parent-agent/children')
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

// Packages
export function createPackage(formData) {
  return axiosInstance.post('/parent-agent/packages', formData)
}

export function listMyPackages() {
  return axiosInstance.get('/parent-agent/packages')
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

export function uploadEventImage(formData) {
  return axiosInstance.post('/parent-agent/packages/event-image', formData)
}

// Vendors
export function listVendors() {
  return axiosInstance.get('/parent-agent/vendors')
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

export default { listChildAgencies, createPackage, listMyPackages, updatePackage, updatePackageCover, updatePackageGallery, deactivatePackage }

// Bookings
export function listBookings() {
  return axiosInstance.get('/parent-agent/bookings')
}

export function getBooking(id) {
  return axiosInstance.get(`/parent-agent/bookings/${id}`)
}

export function createBooking(data) {
  return axiosInstance.post('/parent-agent/bookings', data)
}

export function updateBooking(id, data) {
  return axiosInstance.patch(`/parent-agent/bookings/${id}`, data)
}

// Settings
export function updateProfile(data) {
  return axiosInstance.patch('/parent-agent/profile', data)
}

export function changePassword(data) {
  return axiosInstance.patch('/parent-agent/change-password', data)
}
