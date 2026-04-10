import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getRequiredRolesForPath, getLoginPathForCurrentPath } from '@/shared/utils/roleHelpers.js'
import Loader from '@/shared/components/Loader.jsx'

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isCheckingAuth, user } = useAuth()
  const location = useLocation()

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const loginPath = getLoginPathForCurrentPath(location.pathname)
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  const required = getRequiredRolesForPath(location.pathname)
  if (required && user?.role && !required.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
