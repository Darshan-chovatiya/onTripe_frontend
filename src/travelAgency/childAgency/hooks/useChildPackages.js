import { useCallback, useEffect, useState } from 'react'
import {
  listAvailablePackages,
  listAvailableWhitelabels,
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
      const [pkgRes, wlAvailRes, wlRes] = await Promise.all([
        listAvailablePackages(),
        listAvailableWhitelabels(),
        listMyWhitelabels()
      ])
      
      const pkgs = pkgRes.data?.data?.packages ?? []
      const wlAvail = wlAvailRes.data?.data?.whitelabels ?? []
      
      // Merge available items. Tag whitelabels so UI knows they are whitelabels.
      const mergedAvailable = [
        ...pkgs.map(p => ({ ...p, sourceType: 'original' })),
        ...wlAvail.map(w => ({ ...w, sourceType: 'whitelabel' }))
      ]

      setAvailable(mergedAvailable)
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
