import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import {
  createBooking as apiCreateBooking,
  getBooking as apiGetBooking,
  listBookings,
  updateBooking as apiUpdateBooking,
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useChildBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listBookings()
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

  const fetchBooking = useCallback(async (id) => {
    const res = await apiGetBooking(id)
    return res.data?.data?.booking ?? null
  }, [])

  const updateBooking = useCallback(async (id, body) => {
    const res = await apiUpdateBooking(id, body)
    const updated = res.data?.data?.booking
    if (updated) {
      setBookings((prev) => prev.map((b) => (String(b._id) === String(id) ? { ...b, ...updated } : b)))
    }
    return updated
  }, [])

  return {
    bookings,
    loading,
    error,
    create,
    fetchBooking,
    updateBooking,
    currentUserId: user?.id ?? null,
  }
}
