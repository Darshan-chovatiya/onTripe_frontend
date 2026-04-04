import { useState, useCallback } from 'react'

export function useBooking() {
  const [loading, setLoading] = useState(false)
  const submit = useCallback(async () => {
    setLoading(true)
    try {
      /* await customerApi.createBooking(...) */
    } finally {
      setLoading(false)
    }
  }, [])
  return { loading, submit }
}
