import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import AgencyRegisterShell, { KycDocumentUploads, AgencyLogoSlot } from '@/travelAgency/shared/components/AgencyRegisterShell.jsx'
import '@/travelAgency/shared/components/RegisterForm.css'

const KYC_NOTE = 'By submitting, you agree to our terms. Your account remains pending until KYC is approved by our team.'

export default function ParentRegister() {
  const navigate = useNavigate()
  const { registerParent, isLoading } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    agencyLogo: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '').slice(0, 10) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) setFiles((prev) => ({ ...prev, [e.target.name]: f }))
  }

  const removeKycFile = (name) => setFiles((prev) => ({ ...prev, [name]: null }))

  const validateStep1 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits')
      return false
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return false
    }
    if (!files.agencyLogo) {
      toast.error('Please upload your agency logo')
      return false
    }
    return true
  }

  const handleStep1 = (e) => {
    e.preventDefault()
    if (!validateStep1()) return
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const submitData = new FormData()
    Object.keys(formData).forEach((k) => submitData.append(k, formData[k]))
    if (files.aadharFront) submitData.append('aadharFront', files.aadharFront)
    if (files.aadharBack) submitData.append('aadharBack', files.aadharBack)
    if (files.panCard) submitData.append('panCard', files.panCard)
    if (files.agencyLogo) submitData.append('agencyLogo', files.agencyLogo)

    const res = await registerParent(submitData)
    if (res.success) {
      toast.success('Application submitted. Our team will review your KYC documents.')
      setTimeout(() => navigate('/login'), 2500)
    } else {
      toast.error(res.message || 'Application failed')
    }
  }

  return (
    <AgencyRegisterShell
      title="Parent Agency Registration"
      subtitle="Register your main travel agency. KYC approval required before account activation."
      step={step}
    >
      {step === 1 ? (
        <form onSubmit={handleStep1} className="rform-grid">
          <div className="rform-field">
            <label className="rform-label">Full Name</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><User size={15} /></span>
              <input
                type="text" name="name" className="rform-input"
                value={formData.name} onChange={handleChange}
                placeholder="Your full name" autoComplete="name" required
              />
            </div>
          </div>
          <div className="rform-field">
            <label className="rform-label">Email</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Mail size={15} /></span>
              <input
                type="email" name="email" className="rform-input"
                value={formData.email} onChange={handleChange}
                placeholder="name@company.com" autoComplete="email" required
              />
            </div>
          </div>

          <div className="rform-field">
            <label className="rform-label">Phone</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Phone size={15} /></span>
              <input
                type="tel" name="phone" className="rform-input"
                value={formData.phone} onChange={handleChange}
                placeholder="10-digit number" autoComplete="tel"
                maxLength={10} inputMode="numeric" required
              />
            </div>
          </div>

          <div className="rform-field">
            <label className="rform-label">Password</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Lock size={15} /></span>
              <input
                type={showPassword ? 'text' : 'password'} name="password" className="rform-input"
                value={formData.password} onChange={handleChange}
                placeholder="Min. 8 chars, 1 uppercase, 1 number" minLength={8} autoComplete="new-password" required
              />
              <button type="button" className="rform-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="rform-field rform-field-full">
            <AgencyLogoSlot
              file={files.agencyLogo}
              onFileChange={handleFileChange}
              onRemove={removeKycFile}
            />
          </div>

          <div className="rform-field rform-field-full rform-actions">
            <button type="submit" className="rform-btn-primary">
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <KycDocumentUploads
            files={files}
            onFileChange={handleFileChange}
            onRemoveFile={removeKycFile}
            disclaimer={KYC_NOTE}
          />
          <div className="rform-actions" style={{ marginTop: '18px' }}>
            <button type="button" className="rform-btn-back" onClick={() => setStep(1)}>
              <ChevronLeft size={15} /> Back
            </button>
            <button type="submit" disabled={isLoading} className="rform-btn-primary">
              {isLoading ? (
                <span className="rform-btn-loading"><span className="rform-spinner" /> Submitting…</span>
              ) : (
                <>Submit Registration <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </form>
      )}
    </AgencyRegisterShell>
  )
}
