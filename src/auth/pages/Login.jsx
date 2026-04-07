import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Phone, Ticket } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'
import { ROLES } from '@/shared/utils/constants.js'
import Loader from '@/shared/components/Loader.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, isCheckingAuth, user, loginCustomer, requestCustomerOtp, isLoading } = useAuth()
  const { toast } = useToast()

  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'otp'

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
    const cleanedMobile = mobile.replace(/\D/g, '')
    if (cleanedMobile.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }

    const res = await requestCustomerOtp(cleanedMobile)
    if (res.success) {
      toast.success(res.message || 'OTP sent successfully')
      setStep('otp')
    } else {
      toast.error(res.message || 'Failed to send OTP')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (otp.length !== 4) {
      toast.error('Enter a valid 4-digit OTP')
      return
    }

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
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Sign in' : 'Verify OTP'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {step === 'phone' ? 'OnTrip — unified app' : `OTP sent to +91 ${mobile}`}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 text-primary-500" /> Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="input-field"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="btn-primary w-full py-3 text-lg font-semibold shadow-md active:scale-95 transition-transform"
            >
              {isLoading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                OTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-field text-center text-2xl tracking-[1em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                required
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="btn-primary w-full py-3 text-lg font-semibold shadow-md active:scale-95 transition-transform"
              >
                {isLoading ? 'Verifying…' : 'Login'}
              </button>
              <button 
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Change Phone Number
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact support or your travel agency.
          </p>
        </div>
      </div>
    </div>
  )
}

