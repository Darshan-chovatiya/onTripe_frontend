import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock, Phone, Ticket, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
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
  const { isAuthenticated, isCheckingAuth, user, login, loginCustomer, isLoading } = useAuth()
  const { toast } = useToast()

  const [role, setRole] = useState(ROLES.ADMIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('') // Used as bookingId for customer login
  const [otpSent, setOtpSent] = useState(false)

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
    const res = await login({ email: email.trim(), password })
    if (res.success) {
      toast.success(res.message || 'Login successful')
      navigate(getRoleRedirectPath(res.role), { replace: true })
    } else {
      toast.error(res.message || 'Login failed')
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const cleaned = mobile.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    toast.info('OTP service not yet available in backend. Use any value for Booking ID.')
    setOtpSent(true)
  }

  const handleCustomerLogin = async (e) => {
    e.preventDefault()
    const res = await loginCustomer(mobile, otp)
    if (res.success) {
      toast.success('Welcome back!')
      navigate(getRoleRedirectPath(ROLES.CUSTOMER), { replace: true })
    } else {
      toast.error(res.message || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-scale-in rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">OnTrip — unified app</p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
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

        {role === ROLES.CUSTOMER ? (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-primary-500" /> Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    autoComplete="tel"
                    required
                  />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Booking ID / Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input-field"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter Booking ID"
                    required
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
                <Mail className="h-4 w-4 text-primary-500" /> Email <span className="text-red-500">*</span>
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
                <Lock className="h-4 w-4 text-primary-500" /> Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
