import { useState, useEffect, useCallback, useRef } from 'react'
import { listVendors, createVendor, updateVendor, deleteVendor } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useVendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
  })
  const lastQueryRef = useRef({ page: 1, limit: 10, search: '', type: 'all' })

  const fetchVendors = useCallback(async (query = {}) => {
    const merged = {
      ...lastQueryRef.current,
      ...query,
    }
    lastQueryRef.current = merged

    setLoading(true)
    setError(null)
    try {
      const res = await listVendors(merged)
      const payload = res.data?.data || {}
      setVendors(payload.vendors || [])
      setPagination({
        page: Number(payload.page) || merged.page || 1,
        limit: Number(payload.limit) || merged.limit || 10,
        totalPages: Number(payload.totalPages) || 1,
        totalCount: Number(payload.totalCount) || 0,
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVendors(lastQueryRef.current) }, [fetchVendors])

  const create = useCallback(async (formData) => {
    const res = await createVendor(formData)
    await fetchVendors(lastQueryRef.current)
    return res.data?.data?.vendor
  }, [fetchVendors])

  const update = useCallback(async (id, data) => {
    const res = await updateVendor(id, data)
    await fetchVendors(lastQueryRef.current)
    return res.data?.data?.vendor
  }, [fetchVendors])

  const remove = useCallback(async (id) => {
    await deleteVendor(id)
    await fetchVendors(lastQueryRef.current)
  }, [fetchVendors])

  return { vendors, loading, error, pagination, fetchVendors, create, update, remove }
}
