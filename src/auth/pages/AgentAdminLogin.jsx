import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Clock } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { getPostLoginRedirectPath } from '@/shared/utils/roleHelpers.js'

const REGISTRATION_LINKS = [
  { to: '/travelAgency/parent/register', label: 'Parent agency' },
  { to: '/travelAgency/child/register', label: 'Child agent' },
  { to: '/travelAgency/subchild/register', label: 'Sub-child' },
]

export default function AgentAdminLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, isCheckingAuth, user, login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader size="lg" text="Loading…" />
      </div>
    )
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getPostLoginRedirectPath(user)} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login({ email: email.trim(), password })
    if (!res.success) {
      const msg = res.message || 'Login failed'
      setError(msg)
      return
    }

    navigate(getPostLoginRedirectPath(res.user ?? { role: res.role }), { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="bg-primary-700 px-8 py-7 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-200">OnTrip</p>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">Sign in</h1>
            <p className="mt-2 text-sm leading-snug text-primary-100">
              Administrator and agency accounts. Use your registered email and password.
            </p>
          </header>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
              ) : null}

              <div>
                <label htmlFor="agency-email" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 text-primary-600" strokeWidth={2} />
                  Email
                </label>
                <input
                  id="agency-email"
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="agency-password" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 text-primary-600" strokeWidth={2} />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="agency-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm font-semibold">
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-4">
              <nav className="text-center" aria-label="Agency registration">
                <p className="text-xs text-gray-500">New agency account</p>
                <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm leading-relaxed text-gray-600">
                  {REGISTRATION_LINKS.map((item, i) => (
                    <span key={item.to} className="inline-flex items-center">
                      {i > 0 ? <span className="mr-2 text-gray-300 select-none">·</span> : null}
                      <Link
                        to={item.to}
                        className="font-medium text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </span>
                  ))}
                </p>
              </nav>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} OnTrip. All rights reserved.
        </p>
      </div>
    </div>
  )
}
