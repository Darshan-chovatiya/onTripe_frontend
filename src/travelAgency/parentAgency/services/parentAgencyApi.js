import axiosInstance from '@/shared/services/axiosInstance.js'

export function listChildAgencies() {
  return axiosInstance.get('/agency/parent/children')
}

export default { listChildAgencies }
