import { useCallback, useEffect, useState } from 'react'
import {
  listAvailablePackages,
  listMyWhitelabels,
  createWhitelabel,
  updateWhitelabel,
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useChildPackages() {
  const [available, setAvailable] = useState([])
  const [whitelabels, setWhitelabels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pkgRes, wlRes] = await Promise.all([listAvailablePackages(), listMyWhitelabels()])
      setAvailable(pkgRes.data?.data?.packages ?? [])
      setWhitelabels(wlRes.data?.data?.whitelabels ?? [])
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
    async (body) => {
      await createWhitelabel(body)
      await refresh()
    },
    [refresh]
  )

  const update = useCallback(
    async (id, body) => {
      await updateWhitelabel(id, body)
      await refresh()
    },
    [refresh]
  )

  return {
    availablePackages: available,
    whitelabels,
    loading,
    error,
    refresh,
    createWhitelabel: create,
    updateWhitelabel: update,
  }
}
