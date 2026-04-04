import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock, Phone, Ticket } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'
import { ROLES } from '@/shared/utils/constants.js'
import Loader from '@/shared/components/Loader.jsx'

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.PARENT_AGENCY, label: 'Parent agency' },
  { value: ROLES.CHILD_AGENCY, label: 'Child agency' },
  { value: ROLES.SUB_CHILD, label: 'Sub agency' },
  { value: ROLES.CUSTOMER, label: 'Customer' },
]

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, isCheckingAuth, user, login, sendCustomerOTP, isLoading } = useAuth()

  const [role, setRole] = useState(ROLES.ADMIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader size="lg" text="Loading…" />
      </div>
    )
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login({ type: 'password', email: email.trim(), password, role })
    if (res.success) {
      navigate(getRoleRedirectPath(res.role || role), { replace: true })
    } else {
      setError(res.message || 'Login failed')
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    const cleaned = mobile.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    const res = await sendCustomerOTP(cleaned)
    if (res.success) {
      setOtpSent(true)
      setMobile(cleaned)
    } else {
      setError(res.message || 'Could not send OTP')
    }
  }

  const handleCustomerOtpLogin = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login({ type: 'customerOtp', mobile, otp: otp.trim() })
    if (res.success) {
      navigate(getRoleRedirectPath(res.role || ROLES.CUSTOMER), { replace: true })
    } else {
      setError(res.message || 'Invalid OTP')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">OnTrip — unified app</p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setError('')
              setOtpSent(false)
            }}
            className="input-field"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {role === ROLES.CUSTOMER ? (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4" /> Mobile
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    autoComplete="tel"
                  />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCustomerOtpLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">OTP</label>
                  <input
                    type="text"
                    className="input-field"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    autoComplete="one-time-code"
                  />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </button>
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:underline"
                  onClick={() => {
                    setOtpSent(false)
                    setOtp('')
                  }}
                >
                  Change mobile number
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4" /> Email
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="h-4 w-4" /> Password
              </label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
