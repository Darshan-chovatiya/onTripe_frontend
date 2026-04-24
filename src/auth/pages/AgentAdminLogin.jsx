import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { getPostLoginRedirectPath } from '@/shared/utils/roleHelpers.js'
import logo from '@/assets/onTripLogo.png'
import './AgentAdminLogin.css'

const BG_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1800&q=85'

const REGISTRATION_LINKS = [
  { to: '/travelAgency/parent/register', label: 'Parent Agency' },
  { to: '/travelAgency/child/register', label: 'Child Agent' },
]

export default function AgentAdminLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, isCheckingAuth, user, login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  if (isCheckingAuth) {
    return (
      <div className="alogin-loading">
        <Loader size="lg" text="Loading…" />
      </div>
    )
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getPostLoginRedirectPath(user)} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login({ email: email.trim(), password })
    if (!res.success) {
      setError(res.message || 'Login failed')
      return
    }
    navigate(getPostLoginRedirectPath(res.user ?? { role: res.role }), { replace: true })
  }

  return (
    <div className="alogin-root">
      {/* Background */}
      <div className="alogin-bg">
        <img src={BG_IMAGE} alt="" className="alogin-bg-img" />
        <div className="alogin-bg-overlay" />
      </div>

      {/* Back to home */}
      <Link to="/" className="alogin-back-btn">
        <ChevronLeft size={16} /> Back to Home
      </Link>

      <div className="alogin-layout">
        {/* Left — Branding */}
        <div className="alogin-left">
          <div className="alogin-tagline-wrap">
            <div className="alogin-tagline-badge">
              <span className="alogin-badge-dot" />
              Agency Portal
            </div>
            <h1 className="alogin-tagline">
              Beyond<br />Borders
            </h1>
            <p className="alogin-tagline-desc">
              Unlock the world. Let your wanderlust<br />lead you to your dream destinations.
            </p>
          </div>

          <div className="alogin-stats">
            {[['500+', 'Agencies'], ['2M+', 'Bookings'], ['150+', 'Destinations']].map(([val, lbl]) => (
              <div key={lbl} className="alogin-stat">
                <span className="alogin-stat-val">{val}</span>
                <span className="alogin-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>

          <div className="alogin-trust">
            <div className="alogin-trust-avatars">
              {['A', 'R', 'P', 'S'].map((l, i) => (
                <div key={i} className="alogin-trust-avatar" style={{ zIndex: 4 - i }}>{l}</div>
              ))}
            </div>
            <p className="alogin-trust-text">Trusted by <strong>500+</strong> travel agencies</p>
          </div>
        </div>

        {/* Right — Glass Card */}
        <div className="alogin-card">
          {/* Mobile-only logo */}
          <div className="alogin-mobile-logo">
            <img src={logo} alt="OnTrip" />
          </div>

          <div className="alogin-card-header">
            <h2 className="alogin-card-title">Agency Sign In</h2>
            <p className="alogin-card-sub">Administrator &amp; agency accounts</p>
          </div>

          <form onSubmit={handleSubmit} className="alogin-form">
            {error && (
              <div className="alogin-error">{error}</div>
            )}

            <div className="alogin-field">
              <label className="alogin-label">Email</label>
              <div className="alogin-input-wrap">
                <span className="alogin-input-icon"><Mail size={15} /></span>
                <input
                  type="email"
                  className="alogin-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="alogin-field">
              <div className="alogin-label-row">
                <label className="alogin-label">Password</label>
                <Link to="/forgot-password" className="alogin-forgot">Forgot password?</Link>
              </div>
              <div className="alogin-input-wrap">
                <span className="alogin-input-icon"><Lock size={15} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="alogin-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="alogin-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="alogin-btn-primary">
              {isLoading ? (
                <span className="alogin-btn-loading">
                  <span className="alogin-spinner" /> Signing in…
                </span>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="alogin-divider"><span>New agency?</span></div>

          <div className="alogin-register-links">
            {REGISTRATION_LINKS.map((item) => (
              <Link key={item.to} to={item.to} className="alogin-register-btn">
                {item.label}
              </Link>
            ))}
          </div>

          <p className="alogin-customer-link">
            Customer?{' '}
            <Link to="/customer/login" className="alogin-customer-anchor">Customer Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
