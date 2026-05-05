import { useState, useEffect } from 'react'
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Upload, 
  ShieldCheck, 
  Building2,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getImgUrl = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}/${String(p).replace(/^\//, '')}`) : null

// Document validation rules
const DOCUMENT_RULES = {
  aadharFront: { label: 'Aadhar Front', required: true, maxSize: 5 * 1024 * 1024 },
  aadharBack: { label: 'Aadhar Back', required: true, maxSize: 5 * 1024 * 1024 },
  panCard: { label: 'PAN Card', required: true, maxSize: 5 * 1024 * 1024 },
  agencyLogo: { label: 'Agency Logo', required: true, maxSize: 2 * 1024 * 1024 }
}

export default function SubChildAgentFormModal({ isOpen, onClose, agent, onSave }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gstNumber: '',
    address: '',
    contactPersonName: '',
    kycStatus: 'approved',
    rejectionReason: ''
  })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    agencyLogo: null
  })
  const [previews, setPreviews] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    agencyLogo: null
  })
  const [errors, setErrors] = useState({})
  const [fileErrors, setFileErrors] = useState({})

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        password: '',
        gstNumber: agent.gstNumber || '',
        address: agent.address || '',
        contactPersonName: agent.contactPersonName || '',
        kycStatus: agent.kyc?.status || 'pending',
        rejectionReason: agent.kyc?.rejectionReason || ''
      })
      setPreviews({
        aadharFront: getImgUrl(agent.kyc?.aadharFront),
        aadharBack: getImgUrl(agent.kyc?.aadharBack),
        panCard: getImgUrl(agent.kyc?.panCard),
        agencyLogo: getImgUrl(agent.agencyLogo)
      })
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        gstNumber: '',
        address: '',
        contactPersonName: '',
        kycStatus: 'approved',
        rejectionReason: ''
      })
      setPreviews({
        aadharFront: null,
        aadharBack: null,
        panCard: null,
        agencyLogo: null
      })
    }
    setFiles({
      aadharFront: null,
      aadharBack: null,
      panCard: null,
      agencyLogo: null
    })
    setErrors({})
  }, [agent, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'gstNumber' ? value.toUpperCase() : value }))
  }

  const handleFileChange = (e, key) => {
    const file = e.target.files?.[0]
    if (!file) return

    const rule = DOCUMENT_RULES[key]
    const newFileErrors = { ...fileErrors }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      newFileErrors[key] = `${rule.label} must be JPG, PNG, WebP, or PDF`
      setFileErrors(newFileErrors)
      return
    }

    // Validate file size
    if (file.size > rule.maxSize) {
      const maxSizeMB = rule.maxSize / (1024 * 1024)
      newFileErrors[key] = `${rule.label} must be less than ${maxSizeMB}MB`
      setFileErrors(newFileErrors)
      return
    }

    // Clear error for this file if validation passed
    delete newFileErrors[key]
    setFileErrors(newFileErrors)

    // Set file and preview
    setFiles(prev => ({ ...prev, [key]: file }))
    setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }))
  }

  const validate = () => {
    const newErrors = {}
    const newFileErrors = {}

    // Text field validation
    if (!formData.name.trim()) newErrors.name = 'Agency name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email'
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Phone must be 10 digits'
    
    if (!agent && !formData.password.trim()) newErrors.password = 'Password is required'
    else if (!agent && formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'

    // Business details validation (mandatory)
    if (!formData.contactPersonName.trim()) newErrors.contactPersonName = 'Business name is required'
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!formData.gstNumber.trim()) newErrors.gstNumber = 'GST number is required'
    else if (!gstRegex.test(formData.gstNumber.trim())) newErrors.gstNumber = 'Invalid GST number. Format: 22AAAAA0000A1Z5'
    if (!formData.address.trim()) newErrors.address = 'Business address is required'

    // Rejection reason validation (mandatory when status is rejected)
    if (agent && formData.kycStatus === 'rejected' && !formData.rejectionReason.trim()) {
      newErrors.rejectionReason = 'Rejection reason is required'
    }

    // Document validation (only for new agents)
    if (!agent) {
      Object.entries(DOCUMENT_RULES).forEach(([key, rule]) => {
        if (rule.required && !files[key] && !previews[key]) {
          newFileErrors[key] = `${rule.label} is required`
        }
      })
    }

    setErrors(newErrors)
    setFileErrors(newFileErrors)
    return Object.keys(newErrors).length === 0 && Object.keys(newFileErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const data = new FormData()
      
      // Explicitly append all text fields to ensure they are sent
      Object.keys(formData).forEach(key => {
        const value = formData[key]
        if (value !== null && value !== undefined) {
          data.append(key, value)
        }
      })

      // Append files
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key])
      })

      await onSave(data, agent?._id)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save sub-agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? 'Edit Sub-Agent' : 'Add New Sub-Agent'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agency Details Section */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Agency details</h3>
              <p className="text-xs text-gray-500">Name, email, phone and login password</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Full name <span className="text-red-500">*</span></label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`h-11 w-full rounded-xl border ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                placeholder="Company or individual name"
              />
              {errors.name && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`h-11 w-full rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                placeholder="contact@agency.com"
              />
              {errors.email && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Mobile <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="phone"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                className={`h-11 w-full rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                placeholder="10-digit number"
              />
              {errors.phone && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.phone}</p>}
            </div>

            {!agent && (
              <div>
                <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`h-11 w-full rounded-xl border ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 pr-9 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.password}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Business Details Section */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-gray-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Business details</h3>
              <p className="text-xs text-gray-500">Business information and documents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Business name <span className="text-red-500">*</span></label>
              <input
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
                className={`h-11 w-full rounded-xl border ${errors.contactPersonName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                placeholder="Business name"
              />
              {errors.contactPersonName && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.contactPersonName}</p>}
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">GST number <span className="text-red-500">*</span></label>
              <input
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                maxLength={15}
                className={`h-11 w-full rounded-xl border ${errors.gstNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                placeholder="22AAAAA0000A1Z5"
              />
              {errors.gstNumber && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.gstNumber}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Business Address <span className="text-red-500">*</span></label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className={`w-full resize-none rounded-xl border ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                placeholder="Complete office address"
              />
              {errors.address && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.address}</p>}
            </div>

            {agent && (
              <div className="sm:col-span-2 space-y-4">
                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">KYC Status <span className="text-red-500">*</span></label>
                  <select
                    name="kycStatus"
                    value={formData.kycStatus}
                    onChange={handleChange}
                    className={`h-11 w-full rounded-xl border ${
                      formData.kycStatus === 'approved' ? 'border-emerald-200 bg-emerald-50/50' :
                      formData.kycStatus === 'rejected' ? 'border-red-200 bg-red-50/50' :
                      'border-gray-200 bg-gray-50/50'
                    } px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {formData.kycStatus === 'rejected' && (
                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Rejection Reason <span className="text-red-500">*</span></label>
                    <textarea
                      name="rejectionReason"
                      value={formData.rejectionReason}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Explain what is missing or incorrect in the KYC documents…"
                      className={`w-full resize-none rounded-xl border ${errors.rejectionReason ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50'} px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:bg-white`}
                    />
                    {errors.rejectionReason && <p className="mt-1 ml-1 text-[10px] font-medium text-red-500">{errors.rejectionReason}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documents & Logo Section */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-700" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Documents & Logo</h3>
              <p className="text-xs text-gray-500">{!agent ? 'Upload documents and set initial verification status' : 'Update documents if needed'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { id: 'agencyLogo', label: 'Logo' },
              { id: 'aadharFront', label: 'Aadhar Front' },
              { id: 'aadharBack', label: 'Aadhar Back' },
              { id: 'panCard', label: 'PAN Card' }
            ].map(doc => {
              const hasFile = files[doc.id] || previews[doc.id]
              const hasError = fileErrors[doc.id]
              const rule = DOCUMENT_RULES[doc.id]

              return (
                <div key={doc.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-gray-600">{doc.label}</label>
                    {!agent && rule.required && <span className="text-red-500 text-xs">*</span>}
                  </div>
                  <div className={`relative group aspect-square overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    hasError 
                      ? 'border-red-300 bg-red-50' 
                      : hasFile 
                      ? 'border-emerald-200 bg-emerald-50' 
                      : 'border-dashed border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/30'
                  }`}>
                    {previews[doc.id] ? (
                      <>
                        <img src={previews[doc.id]} alt={doc.label} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 size={20} className="text-emerald-500" />
                            <span className="text-[8px] font-semibold text-emerald-600 bg-white/80 px-1.5 py-0.5 rounded">Uploaded</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                        <Upload size={20} />
                        <span className="text-[9px] font-medium text-center px-1">Click to upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(e) => handleFileChange(e, doc.id)}
                    />
                  </div>
                  {hasError && <p className="text-[9px] font-medium text-red-500">{hasError}</p>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {agent ? 'Update Agent' : 'Add sub-agent'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
