import { useState, useCallback, useMemo } from 'react'

/**
 * @param {number} [initialPage]
 * @param {number} [pageSize]
 */
export function usePagination(initialPage = 1, pageSize = 10) {
  const [page, setPage] = useState(initialPage)

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize])

  const next = useCallback(() => setPage((p) => p + 1), [])
  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const goTo = useCallback((p) => setPage(Math.max(1, p)), [])

  return { page, pageSize, offset, setPage, next, prev, goTo }
}
