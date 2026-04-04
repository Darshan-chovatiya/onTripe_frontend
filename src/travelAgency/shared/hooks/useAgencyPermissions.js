import { useMemo } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { hasPermission } from '@/shared/utils/roleHelpers.js'

export function useAgencyPermissions() {
  const { user } = useAuth()
  const role = user?.role

  const can = useMemo(
    () => ({
      readPackages: () => hasPermission(role, 'agency:packages:read'),
      writePackages: () => hasPermission(role, 'agency:packages:write'),
    }),
    [role]
  )

  return { role, can }
}
