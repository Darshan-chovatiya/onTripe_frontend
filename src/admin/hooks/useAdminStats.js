import { useState, useEffect } from 'react'
import { getDashboardSummary } from '@/admin/services/adminApi.js'

/** Placeholder hook — replace with real `/admin/stats` when available */
export function useAdminStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await getDashboardSummary()
        if (!cancelled) setData(res?.data?.result ?? null)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
