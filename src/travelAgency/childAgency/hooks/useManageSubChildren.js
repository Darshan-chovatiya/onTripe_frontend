import { useCallback, useEffect, useState } from 'react'
import { getSubChild, listSubChildren, updateSubChild } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useManageSubChildren() {
  const [subChildren, setSubChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listSubChildren()
      setSubChildren(res.data?.data?.subChildren ?? [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const fetchOne = useCallback(async (id) => {
    const res = await getSubChild(id)
    return res.data?.data?.subChild ?? null
  }, [])

  const setActive = useCallback(
    async (id, isActive) => {
      const res = await updateSubChild(id, { isActive })
      const updated = res.data?.data?.subChild
      if (updated) {
        setSubChildren((prev) => prev.map((u) => (String(u._id) === String(id) ? { ...u, ...updated } : u)))
      } else {
        await refresh()
      }
      return updated
    },
    [refresh]
  )

  return { subChildren, loading, error, refresh, fetchOne, setActive }
}
