import { useMemo } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export function useChildAgency() {
  const { user } = useAuth()
  return useMemo(() => ({ user, isChildAgency: user?.role === 'childAgency' }), [user])
}
