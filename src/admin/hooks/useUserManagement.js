import { useState, useCallback } from 'react'
import adminApi from '@/admin/services/adminApi.js'

export function useUserManagement() {
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      return await adminApi.listUsers?.()
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, fetchUsers }
}
