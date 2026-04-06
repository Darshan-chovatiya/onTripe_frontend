import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
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
      toast.success(res.message || 'Welcome back, Administrator')
      navigate('/admin/dashboard', { replace: true })
    } else {
      toast.error(res.message || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-primary-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-[400px] relative z-10">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] animate-scale-in">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-sm border border-primary-100/50">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Portal</h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">Secure administrator access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
              <label className="block text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ontrip.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
              <label className="block text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                Security Key
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all text-sm font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-600/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Enterprise Access'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold">
                Secure SSL Environment
              </p>
            </div>
          </div>
        </div>
        
        <p className="mt-6 text-center text-slate-400 text-xs font-semibold">
          &copy; {new Date().getFullYear()} OnTrip System.
        </p>
      </div>
    </div>
  )
}
