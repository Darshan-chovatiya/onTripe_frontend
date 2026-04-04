import { useState, useEffect } from 'react'

export function useTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        /* const res = await customerApi.listTrips() */
        if (!cancelled) setTrips([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { trips, loading }
}
