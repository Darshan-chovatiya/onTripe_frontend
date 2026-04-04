import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'

export default function Unauthorized() {
  const { user, logout } = useAuth()
  const home = user?.role ? getRoleRedirectPath(user.role) : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Unauthorized</h1>
      <p className="mt-2 max-w-md text-gray-600">You do not have access to this area.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to={home} className="btn-primary">
          Go to your dashboard
        </Link>
        <button type="button" className="btn-secondary" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </div>
  )
}
