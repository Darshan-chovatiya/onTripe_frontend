import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ShieldCheck, ArrowRight, ChevronLeft, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import AgencyRegisterShell from '@/travelAgency/shared/components/AgencyRegisterShell.jsx'
import '@/travelAgency/shared/components/RegisterForm.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { requestPasswordReset, verifyResetOtp, resetPassword, isLoading } = useAuth()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
    if (passwords.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')
    const res = await resetPassword(email, otp, passwords.newPassword)
    if (res.success) {
      toast.success('Password reset successful. Please login.')
      setTimeout(() => navigate('/login'), 2000)
    } else {
      toast.error(res.message)
    }
  }

  const stepTitles = ['Forgot password?', 'Verify OTP', 'Reset password']
  const stepSubs = [
    "No worries, we'll send reset instructions to your email.",
    `We've sent a 4-digit OTP to ${email}`,
    'Choose a strong new password for your account.',
  ]

  return (
    <AgencyRegisterShell
      title={stepTitles[step - 1]}
      subtitle={stepSubs[step - 1]}
    >
      {/* Step 1 — Email */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="rform-grid">
          <div className="rform-field rform-field-full">
            <label className="rform-label">Email Address</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Mail size={15} /></span>
              <input
                type="email" className="rform-input"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" autoComplete="email" required
              />
            </div>
          </div>

          <div className="rform-field rform-field-full rform-actions" style={{ marginTop: '8px' }}>
            <button type="submit" disabled={isLoading} className="rform-btn-primary">
              {isLoading
                ? <><span className="rform-spinner" /> Sending…</>
                : <>Send OTP <ArrowRight size={15} /></>
              }
            </button>
          </div>

          <div className="rform-field rform-field-full" style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link to="/login" className="rform-back-link">
              <ChevronLeft size={14} /> Back to login
            </Link>
          </div>
        </form>
      )}

      {/* Step 2 — OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="rform-grid">
          <div className="rform-field rform-field-full">
            <label className="rform-label">Verification OTP</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><ShieldCheck size={15} /></span>
              <input
                type="text" className="rform-input"
                style={{ letterSpacing: '0.4em', fontWeight: 700 }}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••" maxLength={4} inputMode="numeric" required
              />
            </div>
          </div>

          <div className="rform-field rform-field-full rform-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="rform-btn-back" onClick={() => setStep(1)}>
              <ChevronLeft size={15} /> Back
            </button>
            <button type="submit" disabled={isLoading} className="rform-btn-primary">
              {isLoading
                ? <><span className="rform-spinner" /> Verifying…</>
                : <>Verify OTP <ArrowRight size={15} /></>
              }
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="rform-grid">
          <div className="rform-field rform-field-full">
            <label className="rform-label">New Password</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Lock size={15} /></span>
              <input
                type={showNew ? 'text' : 'password'} className="rform-input"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Min. 8 characters" minLength={8} required
              />
              <button type="button" className="rform-eye-btn" onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="rform-field rform-field-full">
            <label className="rform-label">Confirm Password</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Lock size={15} /></span>
              <input
                type={showConfirm ? 'text' : 'password'} className="rform-input"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Repeat password" required
              />
              <button type="button" className="rform-eye-btn" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="rform-field rform-field-full rform-actions" style={{ marginTop: '8px' }}>
            <button type="submit" disabled={isLoading} className="rform-btn-primary">
              {isLoading
                ? <><span className="rform-spinner" /> Resetting…</>
                : <>Reset Password <ArrowRight size={15} /></>
              }
            </button>
          </div>
        </form>
      )}
    </AgencyRegisterShell>
  )
}
