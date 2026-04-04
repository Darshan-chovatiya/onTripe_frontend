import { useState, useMemo } from 'react'

export function useSearch(initial = '') {
  const [query, setQuery] = useState(initial)
  const trimmed = useMemo(() => query.trim(), [query])
  return { query, setQuery, trimmed }
}
