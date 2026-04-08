import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone, Key, Eye, EyeOff, Ticket, FileUp, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

export default function ChildRegister() {
  const navigate = useNavigate()
  const { registerAgent, isLoading } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    parentCode: ''
  })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const submitData = new FormData()
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]))
    if (files.aadharFront) submitData.append('aadharFront', files.aadharFront)
    if (files.aadharBack) submitData.append('aadharBack', files.aadharBack)
    if (files.panCard) submitData.append('panCard', files.panCard)

    const res = await registerAgent(submitData)
    if (res.success) {
      toast.success('Application submitted successfully! Our team will review your KYC documents soon.')
      setTimeout(() => navigate('/login'), 2500)
    } else {
      toast.error(res.message || 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg animate-scale-in rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Child Agent Registration</h1>
          <p className="mt-1 text-sm text-gray-600">Join our growing ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4 text-primary-500" /> Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="input-field"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 text-primary-500" /> Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="input-field"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 text-primary-500" /> Phone number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                className="input-field"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="h-4 w-4 text-primary-500" /> Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="input-field pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="8"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Key className="h-4 w-4 text-primary-500" /> Parent Invitation Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="parentCode"
              placeholder="Ex: ONTRIP-XXXXX"
              className="input-field"
              value={formData.parentCode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-primary-900 border-b border-primary-200 pb-2">
              <ShieldCheck className="h-5 w-5 text-primary-600" /> KYC Verification Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                    <FileUp className="h-3 w-3" /> Aadhar Front <span className="text-red-500">*</span>
                  </label>
                  <label className="relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary-200 bg-white p-3 text-center transition-all hover:border-primary-400 hover:bg-primary-50/20">
                    <input type="file" name="aadharFront" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" required />
                    <span className="text-sm text-gray-600">{files.aadharFront?.name || 'Select File'}</span>
                  </label>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                    <FileUp className="h-3 w-3" /> Aadhar Back <span className="text-red-500">*</span>
                  </label>
                  <label className="relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary-200 bg-white p-3 text-center transition-all hover:border-primary-400 hover:bg-primary-50/20">
                    <input type="file" name="aadharBack" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" required />
                    <span className="text-sm text-gray-600">{files.aadharBack?.name || 'Select File'}</span>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                    <FileUp className="h-3 w-3" /> PAN Card <span className="text-red-500">*</span>
                  </label>
                  <label className="relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary-200 bg-white p-3 text-center transition-all hover:border-primary-400 hover:bg-primary-50/20">
                    <input type="file" name="panCard" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" required />
                    <span className="text-sm text-gray-600">{files.panCard?.name || 'Select File'}</span>
                  </label>
                </div>
                <div className="pt-2 text-[11px] leading-relaxed text-gray-500">
                  By clicking Register, you agree to our terms and conditions. Your account will remain pending until KYC verification is completed.
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 shadow-primary-500/20">
            {isLoading ? <div className="flex items-center justify-center gap-2"><Loader size="sm" color="white" /> Processing...</div> : 'Submit Registration'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-600">Already a partner? </span>
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  )
}
