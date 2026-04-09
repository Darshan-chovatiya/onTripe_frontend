import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone, Key, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import AgencyRegisterShell, { KycDocumentUploads } from '@/travelAgency/shared/components/AgencyRegisterShell.jsx'

const KYC_NOTE =
  'By submitting, you agree to our terms. Your account remains pending until KYC is approved.'

export default function ChildRegister() {
  const navigate = useNavigate()
  const { registerAgent, isLoading } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    parentCode: '',
  })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null,
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFiles((prev) => ({ ...prev, [e.target.name]: f }))
  }

  const removeKycFile = (name) => {
    setFiles((prev) => ({ ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const submitData = new FormData()
    Object.keys(formData).forEach((key) => submitData.append(key, formData[key]))
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
      title="Child agent registration"
      subtitle="Use the invitation code from your parent agency. KYC is required before your account is active."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="child-name" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4 text-primary-600" strokeWidth={2} />
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="child-name"
              type="text"
              name="name"
              className="input-field"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label htmlFor="child-email" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 text-primary-600" strokeWidth={2} />
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="child-email"
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="child-phone" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Phone className="h-4 w-4 text-primary-600" strokeWidth={2} />
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="child-phone"
              type="tel"
              name="phone"
              className="input-field"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
            />
          </div>
          <div>
            <label htmlFor="child-password" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="h-4 w-4 text-primary-600" strokeWidth={2} />
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="child-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="input-field pr-11"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="child-parent-code" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Key className="h-4 w-4 text-primary-600" strokeWidth={2} />
            Parent invitation code <span className="text-red-500">*</span>
          </label>
          <input
            id="child-parent-code"
            type="text"
            name="parentCode"
            placeholder="e.g. ONTRIP-XXXXX"
            className="input-field"
            value={formData.parentCode}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <KycDocumentUploads
          files={files}
          onFileChange={handleFileChange}
          onRemoveFile={removeKycFile}
          disclaimer={KYC_NOTE}
        />

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm font-semibold">
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting…
            </span>
          ) : (
            'Submit registration'
          )}
        </button>
      </form>
    </AgencyRegisterShell>
  )
}
