import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { ROLES } from '@/shared/utils/constants.js'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await login({ email: email.trim(), password })
    if (res.success) {
      if (res.role !== ROLES.ADMIN) {
        toast.error('Access denied. You are not an administrator.')
        return
      }
      toast.success(res.message || 'Welcome back')
      navigate('/admin/dashboard', { replace: true })
    } else {
      toast.error(res.message || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="bg-primary-700 px-8 py-7 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-200">OnTrip</p>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">Admin sign in</h1>
            <p className="mt-2 text-sm leading-snug text-primary-100">Administrator access only.</p>
          </header>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary mt-1 w-full py-3 text-sm font-semibold"
            >
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
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} OnTrip. All rights reserved.
        </p>
      </div>
    </div>
  )
}
