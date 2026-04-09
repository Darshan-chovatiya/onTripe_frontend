import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import {
  createBooking as apiCreateBooking,
  getBooking as apiGetBooking,
  updateBooking as apiUpdateBooking,
  listMyBookings,
} from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useSubChildBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 })

  const fetchBookings = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listMyBookings(params)
      setBookings(res.data?.data?.bookings ?? [])
      setPagination(res.data?.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalCount: 0 })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(
    async (formData) => {
      await apiCreateBooking(formData)
      await fetchBookings()
    },
    [fetchBookings]
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
    pagination,
    fetchBookings,
    create,
    fetchBooking,
    updateBooking,
    currentUserId: user?.id ?? null,
  }
}
