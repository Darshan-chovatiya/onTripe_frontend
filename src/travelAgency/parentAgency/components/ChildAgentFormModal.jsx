import { useState, useEffect, useRef } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Upload, 
  ShieldCheck, 
  Building2,
  AlertCircle
} from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getImgUrl = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}/${String(p).replace(/^\//, '')}`) : null

export default function ChildAgentFormModal({ isOpen, onClose, agent, onSave }) {
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
    kycStatus: 'approved'
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
        kycStatus: agent.kyc?.status || 'pending'
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
        kycStatus: 'approved'
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
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, key) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles(prev => ({ ...prev, [key]: file }))
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!agent && !formData.password.trim()) newErrors.password = 'Password is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
      toast.error(err?.response?.data?.message || 'Failed to save child agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? 'Edit Child Agent' : 'Add New Child Agent'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <section className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <User size={16} className="text-primary-600" />
              Basic Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Agency Name *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building2 size={14} /></span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10`}
                    placeholder="E.g. Travel Hub"
                  />
                </div>
                {errors.name && <p className="mt-1 text-[10px] text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Email Address *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={14} /></span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-200'} py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10`}
                    placeholder="agent@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-[10px] text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Phone Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={14} /></span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-200'} py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10`}
                    placeholder="10-digit number"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[10px] text-red-500">{errors.phone}</p>}
              </div>

              {!agent && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Password *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={14} /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-200'} py-2 pl-9 pr-9 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10`}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-[10px] text-red-500">{errors.password}</p>}
                </div>
              )}
            </div>
          </section>

          {/* Business Details */}
          <section className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <ShieldCheck size={16} className="text-primary-600" />
              Business Details
            </h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Business Name</label>
                <input
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">GST Number</label>
                <input
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  placeholder="GSTIN"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  placeholder="Office address"
                />
              </div>

              {agent && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">KYC Status</label>
                  <select
                    name="kycStatus"
                    value={formData.kycStatus}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* File Uploads */}
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Upload size={16} className="text-primary-600" />
            Documents & Logo
          </h3>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { id: 'agencyLogo', label: 'Logo' },
              { id: 'aadharFront', label: 'Aadhar Front' },
              { id: 'aadharBack', label: 'Aadhar Back' },
              { id: 'panCard', label: 'PAN Card' }
            ].map(doc => (
              <div key={doc.id} className="relative group">
                <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase text-center">{doc.label}</label>
                <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors group-hover:border-primary-300">
                  {previews[doc.id] ? (
                    <img src={previews[doc.id]} alt={doc.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                      <Upload size={20} />
                      <span className="text-[10px] font-medium">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => handleFileChange(e, doc.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {agent ? 'Update Agent' : 'Create Agent'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
