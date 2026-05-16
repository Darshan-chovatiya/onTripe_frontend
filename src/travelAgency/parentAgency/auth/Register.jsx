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
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', password: '',
    gstNumber: '', address: '', contactPersonName: '' 
  })
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

  const validateStep2 = () => {
    if (!files.aadharFront) { toast.error('Aadhaar Front is required'); return false }
    if (!files.aadharBack) { toast.error('Aadhaar Back is required'); return false }
    if (!files.panCard) { toast.error('PAN Card is required'); return false }
    return true
  }

  const handleStep2 = (e) => {
    e.preventDefault()
    if (!validateStep2()) return
    setStep(3)
  }

  const validateStep3 = () => {
    if (!formData.gstNumber.trim()) {
      toast.error('GST Number is required')
      return false
    }
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      toast.error('Please enter a valid GST number')
      return false
    }
    if (!formData.contactPersonName.trim()) {
      toast.error('Business Name is required')
      return false
    }
    if (!formData.address.trim()) {
      toast.error('Business Address is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep3()) return
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
      {step === 1 && (
        <form onSubmit={handleStep1} className="rform-grid">
          <div className="rform-field">
            <label className="rform-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
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
            <label className="rform-label">Email <span style={{ color: '#ef4444' }}>*</span></label>
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
            <label className="rform-label">Phone <span style={{ color: '#ef4444' }}>*</span></label>
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
            <label className="rform-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Lock size={15} /></span>
              <input
                type={showPassword ? 'text' : 'password'} name="password" className="rform-input"
                value={formData.password} onChange={handleChange}
                placeholder="Min. 8 chars" minLength={8} autoComplete="new-password" required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}>
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
      )}
      {step === 2 && (
        <form onSubmit={handleStep2}>
          <KycDocumentUploads
            files={files}
            onFileChange={handleFileChange}
            onRemoveFile={removeKycFile}
            disclaimer={KYC_NOTE}
          />

          <div className="rform-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="rform-btn-back" onClick={() => setStep(1)}>
              <ChevronLeft size={15} /> Back
            </button>
            <button type="submit" className="rform-btn-primary">
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              <h3 className="text-sm font-bold tracking-tight text-[#a3e635] uppercase">Business Details</h3>
            </div>
            
            <div className="rform-grid">
              <div className="rform-field">
                <label className="rform-label">GST Number <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="rform-input-wrap">
                  <span className="rform-input-icon">
                    <svg size={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                  </span>
                  <input
                    type="text" name="gstNumber" className="rform-input"
                    value={formData.gstNumber} onChange={handleChange}
                    placeholder="22AAAAA0000A1Z5" required
                  />
                </div>
              </div>

              <div className="rform-field">
                <label className="rform-label">Business Name <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="rform-input-wrap">
                  <span className="rform-input-icon">
                    <svg size={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                  </span>
                  <input
                    type="text" name="contactPersonName" className="rform-input"
                    value={formData.contactPersonName} onChange={handleChange}
                    placeholder="Business name" required
                  />
                </div>
              </div>

              <div className="rform-field rform-field-full">
                <label className="rform-label">Business Address <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="rform-input-wrap">
                  <span className="rform-input-icon">
                    <svg size={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
                  </span>
                  <input
                    type="text" name="address" className="rform-input"
                    value={formData.address} onChange={handleChange}
                    placeholder="Complete office address" required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rform-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="rform-btn-back" onClick={() => setStep(2)}>
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
