import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'

const PANELS = [
  {
    name: 'Admin',
    description: 'Platform administration',
    path: '/admin/dashboard',
    signInPath: '/admin/login',
  },
  {
    name: 'Agency',
    description: 'Parent, child, or sub-child — one panel, role-based access',
    path: '/agency/dashboard',
    signInPath: '/travelAgency/parent/login',
  },
  {
    name: 'Customer',
    description: 'Book and manage trips',
    path: '/customer/booking',
    signInPath: '/login',
  },
]

export default function Landing() {
  const { isAuthenticated, user, isCheckingAuth } = useAuth()
  const dashboardHref = user?.role ? getRoleRedirectPath(user.role) : '/login'

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-sm">
            <MapPin className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">OnTrip</h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Travel booking across admin, agencies, and customers — sign in to your panel below.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!isCheckingAuth && isAuthenticated ? (
              <Link
                to={dashboardHref}
                className="btn-primary inline-flex items-center gap-2"
              >
                Open your dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link to="/login" className={isAuthenticated ? 'btn-secondary' : 'btn-primary inline-flex items-center gap-2'}>
              Customer sign in
              {!isAuthenticated ? <ArrowRight className="h-4 w-4" /> : null}
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
            Panels &amp; paths
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {PANELS.map((p) => (
              <li
                key={p.name}
                className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-left"
              >
                <div className="font-semibold text-gray-900">{p.name}</div>
                <p className="mt-0.5 text-xs text-gray-500">{p.description}</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div>
                    <span className="text-gray-500">App: </span>
                    <Link to={p.path} className="font-mono text-primary-600 hover:underline">
                      {p.path}
                    </Link>
                  </div>
                  <div>
                    <span className="text-gray-500">Sign in: </span>
                    <Link to={p.signInPath} className="font-mono text-primary-600 hover:underline">
                      {p.signInPath}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs text-gray-400">
            Protected routes redirect to sign-in when you are not authenticated.
          </p>
        </div>
      </footer>
    </div>
  )
}
