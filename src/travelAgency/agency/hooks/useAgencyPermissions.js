import { useMemo } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import {
  AGENCY_ROLE_LABELS,
  getPermissionsForRole,
  P,
} from '@/travelAgency/agency/rbac/agencyPermissions.js'
import { DEV_AGENCY_ROLE_STORAGE_KEY } from '@/travelAgency/agency/constants.js'

const AGENCY_ROLES = [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY, ROLES.SUB_CHILD]

/**
 * @returns {string | undefined}
 */
function readDevRoleOverride() {
  if (!import.meta.env.DEV) return undefined
  try {
    const v = localStorage.getItem(DEV_AGENCY_ROLE_STORAGE_KEY)
    if (v && AGENCY_ROLES.includes(v)) return v
  } catch {
    /* ignore */
  }
  return undefined
}

/**
 * Effective role for RBAC UI: dev override (when valid) wins over `user.role`.
 * @param {string | undefined} authRole
 */
export function getEffectiveAgencyRole(authRole) {
  const override = readDevRoleOverride()
  if (override) return override
  return authRole
}

/**
 * @returns {{
 *   role: string | undefined,
 *   authRole: string | undefined,
 *   roleLabel: string,
 *   permissions: ReadonlySet<string>,
 *   can: (permission: string) => boolean,
 *   loginPathForLogout: string,
 * }}
 */
export function useAgencyPermissions() {
  const { user } = useAuth()
  const authRole = user?.role
  const role = getEffectiveAgencyRole(authRole)

  const isKycPending = Boolean(user?.kyc && (user.kyc.status === 'pending' || user.kyc.status === 'rejected'))

  const permissions = useMemo(() => getPermissionsForRole(role), [role])

  const can = useMemo(() => {
    return (/** @type {string} */ permission) => permissions.has(permission)
  }, [permissions])

  const roleLabel = AGENCY_ROLE_LABELS[role] || 'Agency'

  const loginPathForLogout = useMemo(() => {
    switch (authRole) {
      case ROLES.PARENT_AGENCY:
        return '/login'
      case ROLES.CHILD_AGENCY:
        return '/login'
      case ROLES.SUB_CHILD:
        return '/login'
      default:
        return '/login'
    }
  }, [authRole])

  return {
    role,
    authRole,
    roleLabel,
    permissions,
    can,
    isKycPending,
    loginPathForLogout,
    P,
  }
}
