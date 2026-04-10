import { Navigate, useLocation } from 'react-router-dom'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

/**
 * Renders `children` only if the effective agency role has the given permission(s).
 * Otherwise redirects to a safe in-panel route (avoids /unauthorized for missing features).
 *
 * @param {{
 *   permission?: string,
 *   anyOf?: string[],
 *   children: import('react').ReactNode,
 *   fallbackTo?: string
 * }} props
 */
export default function AgencyPermissionRoute({ permission, anyOf, children, fallbackTo = '/agency/dashboard' }) {
  const { can, isKycPending } = useAgencyPermissions()
  const location = useLocation()

  if (isKycPending && !location.pathname.endsWith('/settings')) {
    return <Navigate to="/agency/settings" replace />
  }

  if (anyOf?.length) {
    if (!anyOf.some((p) => can(p))) {
      return <Navigate to={fallbackTo} replace />
    }
  } else if (permission && !can(permission)) {
    return <Navigate to={fallbackTo} replace />
  }
  return children
}
