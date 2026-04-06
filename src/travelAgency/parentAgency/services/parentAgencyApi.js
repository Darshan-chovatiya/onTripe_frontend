import axiosInstance from '@/shared/services/axiosInstance.js'

export function listChildAgencies() {
  return axiosInstance.get('/agency/parent/children')
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

export default { listChildAgencies, createPackage, listMyPackages, updatePackage, updatePackageCover, updatePackageGallery, deactivatePackage }
