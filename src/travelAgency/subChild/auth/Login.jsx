import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Ticket, Clock } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'

export default function SubChildLogin() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [kycPending, setKycPending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setKycPending(false)
    const res = await login({ email: email.trim(), password })
    if (res.success) {
      navigate(getRoleRedirectPath(res.role), { replace: true })
    } else {
      const msg = res.message || 'Login failed'
      if (msg.toLowerCase().includes('kyc')) {
        setKycPending(true)
      } else {
        setError(msg)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-scale-in rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sub Agent Login</h1>
          <p className="mt-1 text-sm text-gray-600">Access your micro-agency portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {kycPending && (
            <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">KYC Approval Pending</p>
                <p className="mt-0.5 text-xs text-yellow-700">Your account is under review. You will be able to log in once your KYC is approved.</p>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 text-primary-500" /> Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="subagent@ontrip.com"
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
                placeholder="••••••••"
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
            {isLoading ? <div className="flex items-center justify-center gap-2"><Loader size="sm" color="white" /> Signing in...</div> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Working with a Child Agent? </span>
          <Link to="/travelAgency/subchild/register" className="font-semibold text-primary-600 hover:underline">
            Register as Sub Agent
          </Link>
        </div>
      </div>
    </div>
  )
}
