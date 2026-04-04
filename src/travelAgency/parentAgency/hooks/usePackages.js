import { useState, useEffect, useCallback } from 'react'
import {
  listMyPackages,
  createPackage,
  updatePackage,
  updatePackageCover,
  updatePackageGallery,
  deactivatePackage,
} from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function usePackages() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listMyPackages()
      setPackages(res.data?.data?.packages || [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  const create = useCallback(async (formData) => {
    const res = await createPackage(formData)
    await fetchPackages()
    return res.data?.data?.package
  }, [fetchPackages])

  const update = useCallback(async (id, data) => {
    const res = await updatePackage(id, data)
    await fetchPackages()
    return res.data?.data?.package
  }, [fetchPackages])

  const updateCover = useCallback(async (id, formData) => {
    const res = await updatePackageCover(id, formData)
    await fetchPackages()
    return res.data?.data?.package
  }, [fetchPackages])

  const updateGallery = useCallback(async (id, formData) => {
    const res = await updatePackageGallery(id, formData)
    await fetchPackages()
    return res.data?.data?.package
  }, [fetchPackages])

  const deactivate = useCallback(async (id) => {
    await deactivatePackage(id)
    await fetchPackages()
  }, [fetchPackages])

  return { packages, loading, error, fetchPackages, create, update, updateCover, updateGallery, deactivate }
}
