import axios from 'axios'

const FACE_API_BASE_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8000'

const faceApi = axios.create({
  baseURL: FACE_API_BASE_URL,
})

/**
 * @param {File | Blob} selfie - The user's face image
 * @param {string} groupId - The album or package ID
 * @param {number} threshold - Match sensitivity (0.0 to 1.0)
 * @returns {Promise<Object>} - Matching images and diagnostics
 */
export const findMyPhotos = async (selfie, groupId, threshold = 0.5) => {
  const formData = new FormData()
  formData.append('file', selfie)
  formData.append('group_id', groupId)
  formData.append('threshold', threshold.toString())

  try {
    const { data } = await faceApi.post('/guest/find-my-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  } catch (error) {
    console.error('Face recognition search failed:', error)
    throw error
  }
}

export default {
  findMyPhotos,
}
