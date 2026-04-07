import { useState, useEffect, useCallback } from 'react'
import { listVendors, createVendor, updateVendor, deleteVendor } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useVendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listVendors()
      setVendors(res.data?.data?.vendors || [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  const create = useCallback(async (formData) => {
    const res = await createVendor(formData)
    await fetchVendors()
    return res.data?.data?.vendor
  }, [fetchVendors])

  const update = useCallback(async (id, data) => {
    const res = await updateVendor(id, data)
    await fetchVendors()
    return res.data?.data?.vendor
  }, [fetchVendors])

  const remove = useCallback(async (id) => {
    await deleteVendor(id)
    await fetchVendors()
  }, [fetchVendors])

  return { vendors, loading, error, fetchVendors, create, update, remove }
}
