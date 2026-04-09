import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Phone, Ticket } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'
import Loader from '@/shared/components/Loader.jsx'
import { ROLES } from '@/shared/utils/constants.js'

export default function VendorLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, isCheckingAuth, user, requestVendorOtp, loginVendor, isLoading } = useAuth()
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')

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

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const cleaned = phone.replace(/\D/g, '').slice(-10)
    if (cleaned.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    const res = await requestVendorOtp(cleaned)
    if (!res.success) {
      toast.error(res.message || 'Failed to send OTP')
      return
    }
    toast.success(res.message || 'OTP sent successfully')
    setPhone(cleaned)
    setStep('otp')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (otp.length !== 4) {
      toast.error('Enter a valid 4-digit OTP')
      return
    }
    const res = await loginVendor(phone, otp)
    if (!res.success) {
      toast.error(res.message || 'Login failed')
      return
    }
    toast.success('Welcome')
    navigate(getRoleRedirectPath(ROLES.VENDOR), { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{step === 'phone' ? 'Vendor Login' : 'Verify OTP'}</h1>
          <p className="mt-1 text-sm text-gray-600">{step === 'phone' ? 'Sign in with mobile number' : `OTP sent to +91 ${phone}`}</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 text-primary-500" /> Mobile number
              </label>
              <input
                type="tel"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">OTP</label>
              <input
                type="text"
                className="input-field text-center text-2xl tracking-[0.4em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Verifying…' : 'Login'}
            </button>
            <button
              type="button"
              className="w-full text-sm font-medium text-primary-600 hover:text-primary-700"
              onClick={() => {
                setStep('phone')
                setOtp('')
              }}
            >
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

