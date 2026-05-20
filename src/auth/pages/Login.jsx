import { useState, useEffect, useCallback } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Phone, ArrowRight, RotateCcw, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'
import { ROLES } from '@/shared/utils/constants.js'
import Loader from '@/shared/components/Loader.jsx'
import logo from '@/assets/onTripLogo.png'
import './Login.css'

const BG_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=85'

export default function Login() {
  const navigate = useNavigate()
  const { isCustomerAuthenticated, customerUser, isCheckingAuth, loginCustomer, requestCustomerOtp, isLoading } = useAuth()
  const { toast } = useToast()

  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [resendCooldownSec, setResendCooldownSec] = useState(0)

  useEffect(() => {
    if (resendCooldownSec <= 0) return undefined
    const id = setInterval(() => {
      setResendCooldownSec((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [resendCooldownSec])

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const OTP_RESEND_COOLDOWN = 120

  const sendOtpToMobile = useCallback(async () => {
    const cleanedMobile = mobile.replace(/\D/g, '')
    if (cleanedMobile.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return false
    }
    const res = await requestCustomerOtp(cleanedMobile)
    if (res.success) {
      toast.success(res.message || 'OTP sent successfully')
      setResendCooldownSec(OTP_RESEND_COOLDOWN)
      return true
    }
    toast.error(res.message || 'Failed to send OTP')
    return false
  }, [mobile, requestCustomerOtp, toast])

  if (isCheckingAuth) {
    return (
      <div className="clogin-loading">
        <Loader size="lg" text="Loading…" />
      </div>
    )
  }

  if (isCustomerAuthenticated && customerUser) {
    return <Navigate to={getRoleRedirectPath(ROLES.CUSTOMER)} replace />
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const ok = await sendOtpToMobile()
    if (ok) setStep('otp')
  }

  const handleResendOtp = async () => {
    if (resendCooldownSec > 0 || isLoading) return
    await sendOtpToMobile()
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
    <div className="clogin-root">
      {/* Background */}
      <div className="clogin-bg">
        <img src={BG_IMAGE} alt="" className="clogin-bg-img" />
        <div className="clogin-bg-overlay" />
      </div>

      {/* Back to home */}
      <Link to="/" className="clogin-back-btn">
        <ChevronLeft size={16} />
        Back to Home
      </Link>

      <div className="clogin-layout">
        {/* Left — Branding */}
        <div className="clogin-left">
          <div className="clogin-tagline-wrap">
            <div className="clogin-tagline-badge">
              <span className="clogin-badge-dot" />
              Travel Platform
            </div>
            <h1 className="clogin-tagline">
              Explore<br />Horizons
            </h1>
            <p className="clogin-tagline-desc">
              Where your dream destinations<br />become reality.
            </p>
          </div>

          <div className="clogin-stats">
            {[['500+', 'Agencies'], ['150+', 'Destinations'], ['4.9 ★', 'Rating']].map(([val, lbl]) => (
              <div key={lbl} className="clogin-stat">
                <span className="clogin-stat-val">{val}</span>
                <span className="clogin-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>

          <div className="clogin-trust">
            <div className="clogin-trust-avatars">
              {['A', 'R', 'P', 'S'].map((l, i) => (
                <div key={i} className="clogin-trust-avatar" style={{ zIndex: 4 - i }}>{l}</div>
              ))}
            </div>
            <p className="clogin-trust-text">Trusted by <strong>2M+</strong> travelers worldwide</p>
          </div>
        </div>

        {/* Right — Glass Card */}
        <div className="clogin-card">
          {/* Mobile-only logo */}
          <div className="clogin-mobile-logo">
            <img src={logo} alt="OnTrip" />
          </div>
          <div className="clogin-card-header">
            <h2 className="clogin-card-title">
              {step === 'phone' ? 'Welcome Back' : 'Verify OTP'}
            </h2>
            <p className="clogin-card-sub">
              {step === 'phone'
                ? 'Sign in to access your trips'
                : `OTP sent to +91 ${mobile}`}
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="clogin-form">
              <div className="clogin-field">
                <label className="clogin-label">Phone Number</label>
                <div className="clogin-input-wrap">
                  <span className="clogin-input-prefix">
                    <Phone size={15} />
                    <span className="clogin-prefix-code">+91</span>
                  </span>
                  <input
                    type="tel"
                    className="clogin-input"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="clogin-btn-primary">
                {isLoading ? (
                  <span className="clogin-btn-loading">
                    <span className="clogin-spinner" /> Sending OTP…
                  </span>
                ) : (
                  <>Send OTP <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="clogin-form">
              <div className="clogin-field">
                <label className="clogin-label">Enter OTP</label>
                <input
                  type="text"
                  className="clogin-input clogin-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="• • • •"
                  maxLength={4}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" disabled={isLoading} className="clogin-btn-primary">
                {isLoading ? (
                  <span className="clogin-btn-loading">
                    <span className="clogin-spinner" /> Verifying…
                  </span>
                ) : (
                  <>Verify & Login <ArrowRight size={16} /></>
                )}
              </button>

              <div className="clogin-otp-actions">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || resendCooldownSec > 0}
                  className="clogin-link-btn"
                >
                  <RotateCcw size={13} />
                  {resendCooldownSec > 0 ? `Resend in ${formatTimer(resendCooldownSec)}` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setResendCooldownSec(0) }}
                  className="clogin-link-btn"
                >
                  <ChevronLeft size={13} /> Change Number
                </button>
              </div>
            </form>
          )}

          <div className="clogin-divider">
            <span>or</span>
          </div>

          <p className="clogin-agency-link">
            Travel agency?{' '}
            <Link to="/login" className="clogin-agency-anchor">Agency Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
