import { useMemo } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export function useParentAgency() {
  const { user } = useAuth()
  return useMemo(() => ({ user, isParentAgency: user?.role === 'parentAgency' }), [user])
}
