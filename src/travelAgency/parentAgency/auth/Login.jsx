import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Ticket } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

export default function ParentLogin() {
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
      toast.success(res.message || 'Login successful')
      navigate('/agency/dashboard', { replace: true })
    } else {
      toast.error(res.message || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm animate-scale-in">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Agent Login</h1>
          <p className="mt-1 text-sm text-gray-600">Administrative access to OnTrip</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 text-primary-500" /> Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.com"
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
          <span className="text-gray-600">Need to partner with us? </span>
          <Link to="/travelAgency/parent/register" className="font-semibold text-primary-600 hover:underline">
            Register as Parent Agent
          </Link>
        </div>
      </div>
    </div>
  )
}
