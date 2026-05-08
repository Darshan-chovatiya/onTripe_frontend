import { useCallback, useEffect, useState } from 'react'
import { getSubChild, listSubChildren, updateSubChild, approveSubChildKyc, rejectSubChildKyc } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export function useManageSubChildren() {
  const [subChildren, setSubChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 })

  const fetchSubChildren = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listSubChildren(params)
      setSubChildren(res.data?.data?.subChildren ?? [])
      setPagination(res.data?.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalCount: 0 })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

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
        await fetchSubChildren()
      }
      return updated
    },
    [fetchSubChildren]
  )

  const approveKyc = useCallback(async (id) => {
    await approveSubChildKyc(id)
    await fetchSubChildren()
  }, [fetchSubChildren])

  const rejectKyc = useCallback(async (id, reason) => {
    await rejectSubChildKyc(id, reason)
    await fetchSubChildren()
  }, [fetchSubChildren])

  return { subChildren, loading, error, pagination, fetchSubChildren, fetchOne, setActive, approveKyc, rejectKyc }
}
