import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone, Key, Eye, EyeOff, ArrowRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import AgencyRegisterShell, { KycDocumentUploads } from '@/travelAgency/shared/components/AgencyRegisterShell.jsx'
import '@/travelAgency/shared/components/RegisterForm.css'

const KYC_NOTE = 'By submitting, you agree to our terms. Your account remains pending until KYC is approved.'

export default function ChildRegister() {
  const navigate = useNavigate()
  const { registerAgent, isLoading } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', parentCode: '' })
  const [files, setFiles] = useState({ aadharFront: null, aadharBack: null, panCard: null })

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) setFiles((prev) => ({ ...prev, [e.target.name]: f }))
  }

  const removeKycFile = (name) => setFiles((prev) => ({ ...prev, [name]: null }))

  const handleStep1 = (e) => {
    e.preventDefault()
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const submitData = new FormData()
    Object.keys(formData).forEach((k) => submitData.append(k, formData[k]))
    if (files.aadharFront) submitData.append('aadharFront', files.aadharFront)
    if (files.aadharBack) submitData.append('aadharBack', files.aadharBack)
    if (files.panCard) submitData.append('panCard', files.panCard)

    const res = await registerAgent(submitData)
    if (res.success) {
      toast.success('Application submitted. Our team will review your KYC documents.')
      setTimeout(() => navigate('/login'), 2500)
    } else {
      toast.error(res.message || 'Registration failed')
    }
  }

  return (
    <AgencyRegisterShell
      title="Child Agent Registration"
      subtitle="Use the invitation code from your parent agency. KYC required before account activation."
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
                placeholder="10-digit number" autoComplete="tel" required
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
                placeholder="Min. 8 characters" minLength={8} autoComplete="new-password" required
              />
              <button type="button" className="rform-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="rform-field rform-field-full">
            <label className="rform-label">Invitation Code</label>
            <div className="rform-input-wrap">
              <span className="rform-input-icon"><Key size={15} /></span>
              <input
                type="text" name="parentCode" className="rform-input"
                value={formData.parentCode} onChange={handleChange}
                placeholder="e.g. ONTRIP-XXXXX" autoComplete="off" required
              />
            </div>
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
