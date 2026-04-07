import { useCallback, useEffect, useState } from 'react'
import { createBooking as apiCreateBooking, listMyBookings } from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useSubChildBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listMyBookings()
      setBookings(res.data?.data?.bookings ?? [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(
    async (formData) => {
      await apiCreateBooking(formData)
      await refresh()
    },
    [refresh]
  )

  return {
    bookings,
    loading,
    error,
    create,
    refresh,
  }
}
