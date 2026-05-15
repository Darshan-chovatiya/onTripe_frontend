import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck,
  FileText,
  GitBranch,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
  XCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import HierarchyFlowchart from '@/admin/components/HierarchyFlowchart.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

const getFileUrl = (path) => {
  if (!path) return '#'
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
  const cleanBase = baseUrl.trim().replace(/\/api$/, '')
  return `${cleanBase}/${path.replace(/\\/g, '/')}`
}

const isPdfPath = (path) => typeof path === 'string' && /\.pdf$/i.test(path)

// Internal component for Sub-Child Agency Listing inside nested Modal
const SubChildAgenciesModal = ({ isOpen, onClose, parentAgency, onToggleStatus, getStatusBadge }) => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchSubChildren = async () => {
    if (!parentAgency) return
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        role: 'sub_child_agent',
        parentRef: parentAgency._id,
        isActive: status === 'all' ? undefined : (status === 'active' ? 'true' : 'false'),
        search: search || undefined
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to fetch sub-child agencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchSubChildren()
  }, [isOpen, parentAgency, page, status, search])

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sub-Child Agencies`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sub-agencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Status:</div>
            <CustomDropdown
              value={status}
              onChange={setStatus}
              options={statusOptions}
              className="w-full sm:w-40"
              buttonClassName="!py-2"
            />
          </div>
        </div>

        {/* Modal Content Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20">
                <Loader size="md" />
                <p className="text-[10px] font-bold text-gray-400 mt-4 tracking-widest uppercase italic font-black">Syncing Data...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <h4 className="text-sm font-bold text-zinc-900 leading-none">No agencies found</h4>
                <p className="text-xs text-gray-500 mt-1 font-medium">This agency has no sub-child nodes registered yet.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Agency Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Contact Info</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">KYC Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-10">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-bold text-zinc-900 truncate max-w-[140px] leading-tight">{agent.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">ID: {agent._id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-[11px] font-bold text-gray-600 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> {agent.email}</div>
                          <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-300" /> {agent.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(agent.kyc?.status)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right pr-6">
                        <button
                          onClick={async () => {
                            await onToggleStatus(agent._id)
                            fetchSubChildren()
                          }}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 min-w-[85px] shadow-sm ${agent.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${agent.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all font-bold">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all font-bold">Next</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Internal component for Child Agency Listing inside Modal
const ChildAgenciesModal = ({ isOpen, onClose, parentAgency, onToggleStatus, getStatusBadge }) => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  // Sub-child modal state
  const [activeChild, setActiveChild] = useState(null)
  const [isSubChildModalOpen, setIsSubChildModalOpen] = useState(false)

  const fetchChildren = async () => {
    if (!parentAgency) return
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        role: 'child_agent',
        parentRef: parentAgency._id,
        isActive: status === 'all' ? undefined : (status === 'active' ? 'true' : 'false'),
        search: search || undefined
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to fetch child agencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchChildren()
  }, [isOpen, parentAgency, page, status, search])

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Child Agencies`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search child agencies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Status:</div>
              <CustomDropdown
                value={status}
                onChange={setStatus}
                options={statusOptions}
                className="w-full sm:w-40"
                buttonClassName="!py-2"
              />
            </div>
          </div>

          {/* Modal Content Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto overflow-y-visible min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20">
                  <Loader size="md" />
                  <p className="text-[10px] font-bold text-gray-400 mt-4 tracking-widest uppercase italic font-black">Syncing Data...</p>
                </div>
              ) : agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-200 border border-gray-100 mb-3"><Users size={24} /></div>
                  <h4 className="text-sm font-bold text-zinc-900 leading-none">No Child Agents Found</h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium">This parent agency has no registered child agents currently.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Child Agency</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Contact Hub</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">KYC Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-center">Sub-Hierarchy</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agents.map((agent) => (
                      <tr key={agent._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"><Building2 size={14} className="text-gray-400" /></div>
                            <div>
                              <div className="text-sm font-bold text-zinc-900 truncate max-w-[120px] leading-none">{agent.name}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tight">ID: {agent._id.slice(-6).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-[11px] font-bold text-gray-600 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> {agent.email}</div>
                            <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-300" /> {agent.phone || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(agent.kyc?.status)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                setActiveChild(agent)
                                setIsSubChildModalOpen(true)
                              }}
                              className="h-8 px-2.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 transition-all hover:bg-blue-50 hover:border-blue-100 shadow-xs"
                            >
                              <Users size={12} className="text-gray-400" />
                              <span className="text-[11px] font-bold text-zinc-900">{agent.childCount || 0}</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right pr-6">
                          <button
                            onClick={async () => {
                              await onToggleStatus(agent._id)
                              fetchChildren()
                            }}
                            className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm transition-all active:scale-95 min-w-[85px] ${agent.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                              }`}
                          >
                            <div className={`w-1 h-1 rounded-full ${agent.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Modal Footer / Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all font-bold">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all font-bold">Next</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Third Level Hierarchy Modal */}
      <SubChildAgenciesModal
        isOpen={isSubChildModalOpen}
        onClose={() => setIsSubChildModalOpen(false)}
        parentAgency={activeChild}
        onToggleStatus={onToggleStatus}
        getStatusBadge={getStatusBadge}
      />
    </>
  )
}

// Internal component for Add Agency Modal
const AddAgencyModal = ({ isOpen, onClose, onRefresh }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'parent_agent',
    kycStatus: 'approved',
    kycRejectionReason: '',
    gstNumber: '',
    address: '',
    contactPersonName: '',
  })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    agencyLogo: null,
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const handleFileChange = (e, key) => {
    const file = e.target.files[0]
    if (file) setFiles(prev => ({ ...prev, [key]: file }))
  }

  const validate = () => {
    const newErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Agency Name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters'
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required'
    } else if (!phoneRegex.test(formData.phone.trim().replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Security password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Business details validation (mandatory)
    if (!formData.contactPersonName.trim()) {
      newErrors.contactPersonName = 'Business name is required'
    }
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = 'GST number is required'
    } else if (!gstRegex.test(formData.gstNumber.trim().toUpperCase())) {
      newErrors.gstNumber = 'Invalid GST number. Format: 22AAAAA0000A1Z5'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Business address is required'
    }

    // Agency logo validation
    if (!files.agencyLogo) {
      newErrors.agencyLogo = 'Agency logo is required'
    }
    if (!files.aadharFront) {
      newErrors.aadharFront = 'Aadhar front is required'
    }
    if (!files.aadharBack) {
      newErrors.aadharBack = 'Aadhar back is required'
    }
    if (!files.panCard) {
      newErrors.panCard = 'PAN card is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const submissionData = new FormData()
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]))
    Object.keys(files).forEach(key => {
      if (files[key]) submissionData.append(key, files[key])
    })

    try {
      const { data } = await adminApi.createAgent(submissionData)
      if (data.success) {
        toast.success('Parent Agency established with complete document profile')
        onRefresh()
        onClose()
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'parent_agent',
          kycStatus: 'approved',
          kycRejectionReason: '',
          gstNumber: '',
          address: '',
          contactPersonName: '',
        })
        setFiles({ aadharFront: null, aadharBack: null, panCard: null, agencyLogo: null })
        setErrors({})
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Enrollment failed'
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
      else if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('mobile')) setErrors({ phone: msg })
      
      if (msg.includes('E11000')) {
        toast.error('Identity already exists (email or phone)')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const FileSlot = ({ label, id, currentFile, accept, hasError }) => {
    const [previewUrl, setPreviewUrl] = useState(null)

    useEffect(() => {
      if (!currentFile) {
        setPreviewUrl(null)
        return
      }
      const isImage = currentFile.type?.startsWith('image/')
      if (isImage) {
        const url = URL.createObjectURL(currentFile)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
      }
      setPreviewUrl(null)
      return undefined
    }, [currentFile])

    const isPdf =
      currentFile &&
      (currentFile.type === 'application/pdf' || currentFile.name?.toLowerCase().endsWith('.pdf'))

    return (
      <div className="min-w-0 space-y-2">
        <label className={`ml-1 block text-[10px] font-semibold uppercase tracking-wide ${hasError ? 'text-red-500' : 'text-gray-500'}`}>{label}</label>
        <label
          htmlFor={id}
          className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors ${
            currentFile ? 'border-gray-300 bg-gray-50' : hasError ? 'border-dashed border-red-300 bg-red-50 hover:border-red-400 hover:bg-white' : 'border-dashed border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                currentFile ? 'bg-gray-200 text-gray-700' : 'border border-gray-100 bg-white text-gray-400'
              }`}
            >
              {currentFile ? <CheckCircle size={16} strokeWidth={2} /> : <FileText size={16} strokeWidth={2} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-xs font-medium ${currentFile ? 'text-gray-900' : 'text-gray-500'}`}>
                {currentFile ? currentFile.name : 'Click to upload'}
              </div>
              {currentFile && (
                <div className="mt-0.5 text-[10px] font-medium text-gray-600">Ready to submit</div>
              )}
            </div>
          </div>
          {previewUrl && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <img src={previewUrl} alt="" className="max-h-40 w-full object-contain" />
            </div>
          )}
          {currentFile && isPdf && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">
              <FileText className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate font-medium">{currentFile.name}</span>
              <span className="text-gray-400">(PDF)</span>
            </div>
          )}
          <input
            type="file"
            id={id}
            className="sr-only"
            accept={accept || 'image/*,.pdf,application/pdf'}
            onChange={(e) => handleFileChange(e, id)}
          />
        </label>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add parent agency"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <button onClick={onClose} type="button" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? <Loader size="sm" color="white" /> : <><Plus size={18} strokeWidth={2} /> Add agency</>}
          </button>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-4xl space-y-5 px-1 py-1">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Building2 size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Agency details</h3>
              <p className="text-xs text-gray-500">Name, email, phone and login password</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.name ? 'text-red-500' : 'text-gray-600'}`}>Full name <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.name ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="Company or individual name" />
              {errors.name && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.name}</div>}
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.email ? 'text-red-500' : 'text-gray-600'}`}>Email <span className="text-red-500">*</span></label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.email ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="contact@agency.com" />
              {errors.email && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.email}</div>}
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.phone ? 'text-red-500' : 'text-gray-600'}`}>Mobile <span className="text-red-500">*</span></label>
              <input required type="tel" maxLength={10} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.phone ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="10-digit number" />
              {errors.phone && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.phone}</div>}
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.password ? 'text-red-500' : 'text-gray-600'}`}>Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`h-11 w-full rounded-xl border px-4 pr-11 text-sm outline-none transition ${errors.password ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="Minimum 8 characters" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.password}</div>}
            </div>

            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.contactPersonName ? 'text-red-500' : 'text-gray-600'}`}>Business name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.contactPersonName} onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.contactPersonName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="Registered business name" />
              {errors.contactPersonName && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.contactPersonName}</div>}
            </div>

            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.gstNumber ? 'text-red-500' : 'text-gray-600'}`}>GST number <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} maxLength={15} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.gstNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="22AAAAA0000A1Z5" />
              {errors.gstNumber && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.gstNumber}</div>}
            </div>

            <div className="sm:col-span-2">
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.address ? 'text-red-500' : 'text-gray-600'}`}>Business Address <span className="text-red-500">*</span></label>
              <textarea required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className={`w-full resize-y rounded-xl border px-4 py-2.5 text-sm outline-none transition ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="Complete office address" />
              {errors.address && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.address}</div>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ShieldCheck size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">KYC documents & status</h3>
              <p className="text-xs text-gray-500">Upload documents and set initial verification status</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FileSlot label="Aadhar front *" id="aadharFront" currentFile={files.aadharFront} hasError={!!errors.aadharFront} />
            <FileSlot label="Aadhar back *" id="aadharBack" currentFile={files.aadharBack} hasError={!!errors.aadharBack} />
            <FileSlot label="PAN card *" id="panCard" currentFile={files.panCard} hasError={!!errors.panCard} />
          </div>
          {(errors.aadharFront || errors.aadharBack || errors.panCard) && (
            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-red-500 ml-1">
              <AlertCircle size={11} /> Aadhar front, Aadhar back and PAN card are required
            </div>
          )}
          <div className="mt-4 max-w-md">
            <FileSlot
              label="Agency logo *"
              id="agencyLogo"
              currentFile={files.agencyLogo}
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              hasError={!!errors.agencyLogo}
            />
            {errors.agencyLogo && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.agencyLogo}</div>}
          </div>
        </section>
      </div>
    </Modal>
  )
}

/** Single KYC file row in edit modal — previews new or existing file with cleanup for blob URLs */
const EditKycDocRow = ({ doc, existingUrl, newFile, onFileChange, accept }) => {
  const [blobUrl, setBlobUrl] = useState(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null)

  useEffect(() => {
    if (newFile?.type?.startsWith('image/')) {
      const u = URL.createObjectURL(newFile)
      setBlobUrl(u)
      return () => URL.revokeObjectURL(u)
    }
    setBlobUrl(null)
    return undefined
  }, [newFile])

  const isNewPdf = Boolean(
    newFile && (newFile.type === 'application/pdf' || newFile.name?.toLowerCase().endsWith('.pdf'))
  )

  useEffect(() => {
    if (newFile && isNewPdf) {
      const u = URL.createObjectURL(newFile)
      setPdfBlobUrl(u)
      return () => {
        URL.revokeObjectURL(u)
        setPdfBlobUrl(null)
      }
    }
    setPdfBlobUrl(null)
    return undefined
  }, [newFile, isNewPdf])

  const serverUrl = existingUrl && !newFile ? getFileUrl(existingUrl) : null
  const displayUrl = blobUrl || serverUrl
  const isExistingPdf = existingUrl && !newFile && isPdfPath(existingUrl)
  const showImage =
    displayUrl && (newFile ? newFile.type?.startsWith('image/') : existingUrl && !isPdfPath(existingUrl))

  return (
    <div>
      <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">{doc.label}</label>
      <div className="relative rounded-xl border border-dashed border-gray-200 bg-gray-50/50 transition-colors hover:border-gray-300 hover:bg-white">
        <input
          type="file"
          onChange={onFileChange}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          accept={accept || 'image/*,.pdf,application/pdf'}
        />
        <div className="p-3">
          <div className="flex items-center gap-3">
            {newFile ? (
              <CheckCircle size={16} className="shrink-0 text-gray-700" strokeWidth={2} />
            ) : existingUrl ? (
              <FileCheck size={16} className="shrink-0 text-gray-600" strokeWidth={2} />
            ) : (
              <FileText size={16} className="shrink-0 text-gray-300" strokeWidth={2} />
            )}
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800">
              {newFile ? newFile.name : existingUrl ? 'Document on file — click to replace' : 'Click to upload'}
            </span>
            {existingUrl && (
              <a
                href={getFileUrl(existingUrl)}
                target="_blank"
                rel="noreferrer"
                className="relative z-20 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-gray-800"
                onClick={(e) => e.stopPropagation()}
                title="Open in new tab"
              >
                <ExternalLink size={14} strokeWidth={2} />
              </a>
            )}
          </div>
          {showImage && displayUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-100 bg-white">
              <img src={displayUrl} alt={doc.label} className="max-h-44 w-full object-contain" />
            </div>
          )}
          {(isNewPdf || isExistingPdf) && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{newFile ? newFile.name : 'PDF document'}</span>
              </span>
              {pdfBlobUrl && (
                <a href={pdfBlobUrl} target="_blank" rel="noreferrer" className="shrink-0 font-medium text-gray-700 hover:underline">
                  Open
                </a>
              )}
              {!pdfBlobUrl && serverUrl && isExistingPdf && (
                <a href={serverUrl} target="_blank" rel="noreferrer" className="shrink-0 font-medium text-gray-700 hover:underline">
                  Open
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Internal component for Edit Agency Modal
const EditAgencyModal = ({ isOpen, onClose, agent, onRefresh }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gstNumber: '',
    address: '',
    contactPersonName: '',
    kycStatus: 'approved',
    kycRejectionReason: '',
  })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    agencyLogo: null,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        gstNumber: agent.gstNumber || '',
        address: agent.address || '',
        contactPersonName: agent.contactPersonName || '',
        kycStatus: agent.kyc?.status || 'pending',
        kycRejectionReason: agent.kyc?.rejectionReason || '',
      })
      setFiles({ aadharFront: null, aadharBack: null, panCard: null, agencyLogo: null })
      setErrors({})
    }
  }, [agent])

  const handleFileChange = (e, key) => {
    const file = e.target.files[0]
    if (file) setFiles(prev => ({ ...prev, [key]: file }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Agency Name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters'
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    const phoneRegex = /^[0-9]{10}$/
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required'
    } else if (!phoneRegex.test(formData.phone.trim().replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validate()) return
    
    // Validate rejection reason is required when status is rejected
    if (formData.kycStatus === 'rejected' && !formData.kycRejectionReason.trim()) {
      toast.error('Rejection reason is required when rejecting KYC')
      return
    }

    setLoading(true)
    const submissionData = new FormData()
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]))
    Object.keys(files).forEach(key => {
      if (files[key]) submissionData.append(key, files[key])
    })

    try {
      const { data } = await adminApi.updateAgent(agent._id, submissionData)
      if (data.success) {
        toast.success('Agency profile and documents updated successfully')
        onRefresh()
        onClose()
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Update failed'
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
      else if (msg.toLowerCase().includes('phone')) setErrors({ phone: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit parent agency"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <button onClick={onClose} type="button" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
            Cancel
          </button>
          <button
            form="edit-agency-form"
            type="submit"
            disabled={loading || (formData.kycStatus === 'rejected' && !formData.kycRejectionReason.trim())}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50"
            title={formData.kycStatus === 'rejected' && !formData.kycRejectionReason.trim() ? 'Rejection reason is required' : ''}
          >
            {loading ? <Loader size="sm" color="white" /> : 'Save changes'}
          </button>
        </div>
      }
    >
      <form id="edit-agency-form" onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl space-y-5 px-1 py-1">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Building2 size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Agency details</h3>
              <p className="text-xs text-gray-500">Same layout as add — password is not shown here; use agent code for reference</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.name ? 'text-red-500' : 'text-gray-600'}`}>Full name</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.name ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="Company name" />
              {errors.name && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.name}</div>}
            </div>
            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Business name</label>
              <input
                type="text"
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.email ? 'text-red-500' : 'text-gray-600'}`}>Email</label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.email ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="contact@agency.com" />
              {errors.email && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.email}</div>}
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.phone ? 'text-red-500' : 'text-gray-600'}`}>Mobile</label>
              <input required type="tel" maxLength={10} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.phone ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="10-digit number" />
              {errors.phone && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.phone}</div>}
            </div>
            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">GST number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
                placeholder="GSTIN"
              />
            </div>
            <div>
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-500">Agent code</label>
              <div className="flex h-11 items-center rounded-xl border border-dashed border-gray-200 bg-gray-100/80 px-4 text-sm font-semibold text-primary-700">
                {agent?.agentCode || '—'}
              </div>
              <p className="mt-1 ml-1 text-[10px] text-gray-400">Read-only</p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ShieldCheck size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">KYC status & documents</h3>
              <p className="text-xs text-gray-500">Update verification status or replace documents</p>
            </div>
          </div>
          <div className="mb-4 max-w-xs">
            <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">KYC status</label>
            <CustomDropdown
              value={formData.kycStatus}
              onChange={(v) => setFormData({ ...formData, kycStatus: v })}
              options={[
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              className="w-full"
              buttonClassName="!py-2.5"
            />
          </div>
          {formData.kycStatus === 'rejected' && (
            <div className="mb-4">
              <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Rejection reason <span className="text-red-600">*</span></label>
              <textarea
                value={formData.kycRejectionReason}
                onChange={(e) => setFormData({ ...formData, kycRejectionReason: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </div>
          )}

          <div className="mb-4 max-w-md">
            <EditKycDocRow
              doc={{ label: 'Agency logo (optional)' }}
              existingUrl={agent?.agencyLogo}
              newFile={files.agencyLogo}
              onFileChange={(e) => handleFileChange(e, 'agencyLogo')}
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: 'aadharFront', label: 'Aadhar front' },
              { id: 'aadharBack', label: 'Aadhar back' },
              { id: 'panCard', label: 'PAN card' },
            ].map((doc) => (
              <EditKycDocRow
                key={doc.id}
                doc={doc}
                existingUrl={agent?.kyc?.[doc.id]}
                newFile={files[doc.id]}
                onFileChange={(e) => handleFileChange(e, doc.id)}
              />
            ))}
          </div>
        </section>
      </form>
    </Modal>
  )
}

export default function Agencies() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')
  const [togglingId, setTogglingId] = useState(null)

  // KYC Modal State
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isKycModalOpen, setIsKycModalOpen] = useState(false)

  // Hierarchy Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAgency, setEditingAgency] = useState(null)

  const [rejectionReason, setRejectionReason] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [hierarchyModal, setHierarchyModal] = useState({ open: false, agentId: null, title: '' })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, kycFilter])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        role: 'parent_agent',
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : 'false',
        search: debouncedSearch || undefined,
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
        setTotal(data.data.totalCount ?? 0)
      }
    } catch (error) {
      toast.error('Failed to fetch agencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [page, debouncedSearch, statusFilter, kycFilter])

  const handleKycAction = async (action) => {
    if (!selectedAgent) return
    setIsActionLoading(true)
    try {
      let res
      if (action === 'approve') {
        res = await adminApi.approveKyc(selectedAgent._id)
      } else {
        if (!rejectionReason.trim()) {
          toast.error('Please provide a reason for rejection')
          setIsActionLoading(false)
          return
        }
        res = await adminApi.rejectKyc(selectedAgent._id, rejectionReason)
      }

      if (res.data.success) {
        toast.success(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        setIsKycModalOpen(false)
        fetchAgents()
      }
    } catch (error) {
      toast.error(`Failed to ${action} KYC`)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleAgent = async (id) => {
    if (togglingId) return
    setTogglingId(id)
    try {
      const { data } = await adminApi.toggleAgent(id)
      if (data.success) {
        toast.success(data.message)
        fetchAgents()
      }
    } catch (error) {
      toast.error('Failed to toggle agent status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteAgent = async (agent) => {
    const result = await Swal.fire({
      title: 'Terminate Agency?',
      text: `Are you certain you want to remove ${agent.name}? This action is irreversible and will revoke all platform access.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, Terminate',
      cancelButtonText: 'Retain Agency',
      background: '#ffffff',
      customClass: {
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-sm text-slate-500',
        confirmButton: 'rounded-xl px-6 py-2.5 font-bold text-sm',
        cancelButton: 'rounded-xl px-6 py-2.5 font-bold text-sm'
      }
    })

    if (result.isConfirmed) {
      setIsActionLoading(true)
      try {
        await adminApi.deleteAgent(agent._id)
        toast.success(`${agent.name} has been purged from the registry`)
        fetchAgents()
      } catch (error) {
        toast.error('Termination sequence failed')
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
      pending: { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border min-w-[90px] shadow-sm ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'All accounts' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const kycStatusOptions = [
    { value: 'all', label: 'All KYC' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listAgents({
        role: 'parent_agent', limit: 10000, page: 1,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : 'false',
        search: debouncedSearch || undefined,
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
      })
      await exportToExcel(
        (data?.data?.agents ?? []).map((a) => ({
          'Full name': a.name || '',
          'Business Name': a.contactPersonName || '',
          Email: a.email || '',
          Mobile: a.phone || '',
          'GST number': a.gstNumber || '',
          Address: a.address || '',
          'Agent code': a.agentCode || '',
          'KYC status': a.kyc?.status || 'pending',
          'Account status': a.isActive ? 'Active' : 'Inactive',
          Children: a.childCount ?? 0,
          Packages: a.packageCount ?? 0,
          Customers: a.customerCount ?? 0,
          'Joined on': a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
        })),
        'parent-agencies', 'Parent Agencies'
      )
    } catch { toast.error('Export failed') }
    finally { setExportLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Parent Agencies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage tier-1 travel distribution entities and corporate identities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
          >
            {exportLoading ? <Loader size="sm" /> : <Download size={16} strokeWidth={2} />}
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 sm:w-auto sm:self-auto"
          >
            <Plus size={18} strokeWidth={2} />
            Add Agency
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search name, email, or phone…"
              autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:flex lg:shrink-0 lg:gap-3">
            <div className="w-full sm:min-w-[140px] lg:w-44">
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-full"
                buttonClassName="!py-2"
              />
            </div>
            <div className="w-full sm:min-w-[140px] lg:w-44">
              <CustomDropdown
                value={kycFilter}
                onChange={setKycFilter}
                options={kycStatusOptions}
                className="w-full"
                buttonClassName="!py-2"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size="lg" />
            <p className="mt-4 text-xs text-gray-500">Loading agencies…</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Building2 className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No agencies found</p>
            <p className="mt-1 text-sm text-gray-500">Try adjusting search, account status, or KYC filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Parent agency</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Children</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Packages</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Contact</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Account</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">KYC</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((agent) => (
                  <tr key={agent._id} className="group transition-colors hover:bg-gray-50/80">
                    <td className="px-4 py-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-transform group-hover:scale-[1.02]">
                          {agent.agencyLogo ? (
                            <img
                              src={getFileUrl(agent.agencyLogo)}
                              alt={agent.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-4 w-4" strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">{agent.name}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                            <span className="truncate">{agent.email}</span>
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary-700">
                            <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2} />
                            {agent.agentCode || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/child-agencies?parentRef=${agent._id}`)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                          title="View child agencies"
                        >
                          <Users className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                          <span>{agent.childCount ?? 0}</span>
                          {/* <span className="text-gray-400">children</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" strokeWidth={2} /> */}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/packages?parentAgencyId=${agent._id}`)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium tabular-nums text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                          title="Open Packages Management filtered to this parent agency"
                        >
                          <Package className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                          <span>{agent.packageCount ?? 0}</span>
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-400">
                          <Phone className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{agent.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <button
                        type="button"
                        disabled={togglingId === agent._id}
                        onClick={() => handleToggleAgent(agent._id)}
                        className={`inline-flex min-w-[88px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                          agent.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90'
                            : 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100/90'
                        }`}
                        title={agent.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-red-500'} ${agent.isActive ? 'animate-pulse' : ''}`}
                        />
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="inline-flex" title="Open the eye icon to view agency details and manage KYC">
                        {getStatusBadge(agent.kyc?.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgent(agent)
                            setIsKycModalOpen(true)
                          }}
                          className="inline-flex cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary-200 hover:text-primary-700 active:scale-95"
                          title="View agency"
                          aria-label={`View ${agent.name}`}
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAgency(agent)
                            setIsEditModalOpen(true)
                          }}
                          className="inline-flex cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-emerald-200 hover:text-emerald-700 active:scale-95"
                          title="Edit agency"
                          aria-label={`Edit ${agent.name}`}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setHierarchyModal({
                              open: true,
                              agentId: agent._id,
                              title: agent.name,
                            })
                          }
                          className="inline-flex cursor-pointer rounded-lg border border-violet-200 bg-violet-50 p-2 text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100 active:scale-95"
                          title="Network map — this agency and downstream tree"
                          aria-label={`Hierarchy map for ${agent.name}`}
                        >
                          <GitBranch className="h-4 w-4" strokeWidth={2} />
                        </button>
                        {/* <button
                          type="button"
                          onClick={() => handleDeleteAgent(agent)}
                          disabled={isActionLoading}
                          className="inline-flex cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-rose-200 hover:text-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete agency"
                          aria-label={`Delete ${agent.name}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={10}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Add Agency Modal */}
      <AddAgencyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRefresh={fetchAgents}
      />

      {/* Edit Agency Modal */}
      <EditAgencyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        agent={editingAgency}
        onRefresh={fetchAgents}
      />

      <Modal
        isOpen={isKycModalOpen}
        onClose={() => { setIsKycModalOpen(false); setRejectionReason('') }}
        title="Agency overview"
        size="lg"
      >
        {selectedAgent && (
          <div className="divide-y divide-gray-100">

            {/* ── Header + Network side by side ── */}
            <div className="flex items-start gap-2 px-6 py-4">
              {/* Left: avatar + name + email + badges */}
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
                  {selectedAgent.agencyLogo ? (
                    <img
                      src={getFileUrl(selectedAgent.agencyLogo)}
                      alt={selectedAgent.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900">{selectedAgent.name}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{selectedAgent.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {getStatusBadge(selectedAgent.kyc?.status)}
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${selectedAgent.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedAgent.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {selectedAgent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: network stats column */}
              <div className="shrink-0 space-y-1.5 min-w-[140px]">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500">Children</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{selectedAgent.childCount ?? 0}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsKycModalOpen(false); navigate(`/admin/packages?parentAgencyId=${selectedAgent._id}`) }}
                  className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2 transition-colors hover:border-primary-200 hover:bg-primary-50/50"
                >
                  <span className="text-xs font-medium text-gray-500">Packages</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{selectedAgent.packageCount ?? 0}</span>
                </button>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500">Customers</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{selectedAgent.customerCount ?? 0}</span>
                </div>
              </div>
            </div>

            {/* ── Agency details ── */}
            <div className="px-6 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Details</p>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {[
                  { label: 'Business Name', value: selectedAgent.contactPersonName },
                  { label: 'Mobile', value: selectedAgent.phone },
                  { label: 'GST number', value: selectedAgent.gstNumber },
                  { label: 'Agent code', value: selectedAgent.agentCode, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-gray-400">{label}</dt>
                    <dd className={`mt-0.5 text-sm ${highlight ? 'font-semibold text-primary-700' : 'text-gray-900'}`}>{value || '—'}</dd>
                  </div>
                ))}
                {selectedAgent.address && (
                  <div className="sm:col-span-2">
                    <dt className="flex items-center gap-1 text-xs font-medium text-gray-400"><MapPin className="h-3 w-3" strokeWidth={2} /> Address</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">{selectedAgent.address}</dd>
                  </div>
                )}
                {selectedAgent.kyc?.status === 'rejected' && selectedAgent.kyc?.rejectionReason && (
                  <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-xs font-semibold text-red-700">Rejection reason</p>
                    <p className="mt-0.5 text-xs text-red-600">{selectedAgent.kyc.rejectionReason}</p>
                  </div>
                )}
              </dl>
            </div>

            {/* ── KYC documents ── */}
            <div className="px-6 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">KYC documents</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Aadhar front', path: selectedAgent.kyc?.aadharFront },
                  { label: 'Aadhar back',  path: selectedAgent.kyc?.aadharBack },
                  { label: 'PAN card',     path: selectedAgent.kyc?.panCard },
                ].map((doc) => (
                  <div key={doc.label} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex aspect-[4/3] items-center justify-center bg-gray-50 p-2">
                      {doc.path ? (
                        isPdfPath(doc.path) ? (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <FileText className="h-9 w-9 text-gray-300" strokeWidth={1.5} />
                            <a href={getFileUrl(doc.path)} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary-600 hover:underline">Open PDF</a>
                          </div>
                        ) : (
                          <img src={getFileUrl(doc.path)} alt={doc.label} className="max-h-40 w-full object-contain" />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-300">
                          <XCircle className="h-7 w-7" strokeWidth={1.5} />
                          <span className="text-xs">Not uploaded</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
                      <span className="text-xs font-medium text-gray-600">{doc.label}</span>
                      {doc.path && (
                        <a href={getFileUrl(doc.path)} target="_blank" rel="noreferrer" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-700">
                          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {Array.isArray(selectedAgent.kyc?.otherDocs) && selectedAgent.kyc.otherDocs.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-tight text-gray-400">Other documents</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.kyc.otherDocs.map((path, i) => (
                      <a
                        key={i}
                        href={getFileUrl(path)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                      >
                        {isPdfPath(path) ? <FileText size={14} /> : <Eye size={14} />}
                        <span>Document {i + 1}</span>
                        <ExternalLink size={12} className="opacity-40" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── KYC history ── */}
            {selectedAgent.kycHistory?.length > 0 && (
              <div className="px-6 py-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} /> Previous submissions
                </p>
                <div className="space-y-2">
                  {selectedAgent.kycHistory.map((h, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">{new Date(h.submittedAt || Date.now()).toLocaleDateString()}</span>
                        {getStatusBadge(h.status)}
                      </div>
                      {h.rejectionReason && (
                        <p className="mb-2 rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 text-xs text-red-600">
                          <span className="font-semibold">Reason: </span>{h.rejectionReason}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {[['aadharFront','Aadhar front'],['aadharBack','Aadhar back'],['panCard','PAN card']].map(([key, lbl]) => h[key] ? (
                          <a key={key} href={getFileUrl(h[key])} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-primary-700">
                            <FileText className="h-3 w-3" /> {lbl}
                          </a>
                        ) : null)}
                        {Array.isArray(h.otherDocs) && h.otherDocs.map((path, i) => (
                          <a key={i} href={getFileUrl(path)} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-primary-700">
                            <FileText className="h-3 w-3" /> Doc {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── KYC actions (pending only) ── */}
            {selectedAgent.kyc?.status === 'pending' && (
              <div className="px-6 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Review KYC</p>
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-gray-600" htmlFor="kyc-reject-reason">
                    Rejection reason <span className="text-gray-400">(required to reject)</span>
                  </label>
                  <textarea
                    id="kyc-reject-reason"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    placeholder="Explain what is missing or incorrect…"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => handleKycAction('approve')} disabled={isActionLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                    {isActionLoading ? <Loader size="sm" color="white" /> : <><ShieldCheck className="h-4 w-4" strokeWidth={2} /> Approve</>}
                  </button>
                  <button type="button" onClick={() => handleKycAction('reject')} disabled={isActionLoading || !rejectionReason.trim()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50">
                    {isActionLoading ? <Loader size="sm" /> : <><ShieldAlert className="h-4 w-4" strokeWidth={2} /> Reject</>}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

      <Modal
        isOpen={hierarchyModal.open}
        onClose={() => setHierarchyModal((s) => ({ ...s, open: false }))}
        title={`Agency map · ${hierarchyModal.title || 'Agency'}`}
        size="full"
      >
        <div className="flex h-[calc(100dvh-7rem)] min-h-[min(560px,85dvh)] w-full flex-col">
          {hierarchyModal.agentId ? (
            <HierarchyFlowchart type="agent" id={hierarchyModal.agentId} />
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
