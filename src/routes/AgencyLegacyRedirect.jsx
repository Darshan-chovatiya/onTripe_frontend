import { Navigate, useLocation } from 'react-router-dom'

/**
 * Maps old `/agency/parent|child|sub/...` URLs to the unified `/agency/...` tree.
 */
export default function AgencyLegacyRedirect({ mode }) {
  const { pathname } = useLocation()
  const prefix = `/agency/${mode}`
  let suffix = pathname.replace(new RegExp(`^${prefix.replace(/\//g, '\\/')}\\/?`), '')
  if (!suffix) suffix = 'dashboard'
  if (!suffix.startsWith('/')) suffix = `/${suffix}`

  if (mode === 'child') {
    suffix = suffix.replace(/\/manage-sub-children(\/|$)/, '/manage-downstream$1')
  }

  return <Navigate to={`/agency${suffix}`} replace />
}
