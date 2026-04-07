import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createWhitelabel,
  listAvailableWhitelabels,
  listMyWhitelabels,
  updateWhitelabel,
} from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useSubChildPackages() {
  const [availablePackages, setAvailablePackages] = useState([])
  const [whitelabels, setWhitelabels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [parentWhitelabelByPackageId, setParentWhitelabelByPackageId] = useState(new Map())

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [availableRes, ownRes] = await Promise.all([listAvailableWhitelabels(), listMyWhitelabels()])

      const availableParentWhitelabels = availableRes.data?.data?.whitelabels ?? []
      const ownWhitelabels = ownRes.data?.data?.whitelabels ?? []

      const map = new Map()
      const packageRows = []
      for (const wl of availableParentWhitelabels) {
        const pkg = wl.originalPackage
        if (!pkg?._id) continue
        const packageId = String(pkg._id)
        if (!map.has(packageId)) map.set(packageId, wl._id)
        packageRows.push({
          ...pkg,
          _id: packageId,
          basePrice: wl.finalPrice ?? pkg.basePrice,
          __parentWhitelabelId: wl._id,
        })
      }

      setParentWhitelabelByPackageId(map)
      setAvailablePackages(packageRows)
      setWhitelabels(ownWhitelabels)
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
      const parentWhitelabelId = body?.packageId ? parentWhitelabelByPackageId.get(String(body.packageId)) : null
      if (!parentWhitelabelId) {
        throw new Error('Parent offer is not available for this package')
      }
      await createWhitelabel({
        parentWhitelabelId,
        customTitle: body.customTitle,
        customDescription: body.customDescription,
        commissionType: body.commissionType,
        commissionValue: body.commissionValue,
      })
      await refresh()
    },
    [parentWhitelabelByPackageId, refresh]
  )

  const update = useCallback(
    async (id, body) => {
      await updateWhitelabel(id, body)
      await refresh()
    },
    [refresh]
  )

  return useMemo(
    () => ({
      availablePackages,
      whitelabels,
      loading,
      error,
      refresh,
      createWhitelabel: create,
      updateWhitelabel: update,
    }),
    [availablePackages, whitelabels, loading, error, refresh, create, update]
  )
}
