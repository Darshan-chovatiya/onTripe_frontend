import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ShieldCheck, ArrowRight, ChevronLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { requestPasswordReset, verifyResetOtp, resetPassword, isLoading } = useAuth()

  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Reset
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    const res = await requestPasswordReset(email)
    if (res.success) {
      toast.success(res.message || 'OTP sent to your email')
      setStep(2)
    } else {
      toast.error(res.message)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp) return toast.error('Please enter the OTP')
    const res = await verifyResetOtp(email, otp)
    if (res.success) {
      toast.success('OTP verified. Set your new password.')
      setStep(3)
    } else {
      toast.error(res.message)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!passwords.newPassword) return toast.error('Please enter new password')
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')

    const res = await resetPassword(email, otp, passwords.newPassword)
    if (res.success) {
      toast.success('Password reset successful. Please login.')
      setTimeout(() => navigate('/login'), 2000)
    } else {
      toast.error(res.message)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            {step === 1 && <Mail size={24} />}
            {step === 2 && <ShieldCheck size={24} />}
            {step === 3 && <Lock size={24} />}
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {step === 1 && 'Forgot password?'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset password'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {step === 1 && "No worries, we'll send you reset instructions."}
            {step === 2 && `We've sent an OTP to ${email}`}
            {step === 3 && 'Choose a strong password for your account.'}
          </p>
        </div>

        {/* Form Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Send OTP'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {/* Form Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Verification OTP</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ShieldCheck size={16} />
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium tracking-[0.5em] outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  placeholder="••••"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              {/* <p className="mt-2 text-xs text-slate-400">Hint: Use 2345 for bypass</p> */}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <ChevronLeft size={14} /> Change Email
            </button>
          </form>
        )}

        {/* Form Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-50"
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline">
            <ChevronLeft size={16} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
