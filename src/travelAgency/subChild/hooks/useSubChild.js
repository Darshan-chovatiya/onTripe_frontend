import { useMemo } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export function useSubChild() {
  const { user } = useAuth()
  return useMemo(() => ({ user, isSubChild: user?.role === 'subChild' }), [user])
}
