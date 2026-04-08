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
  Eye,
  ExternalLink,
  FileCheck,
  FileText,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

const getFileUrl = (path) => {
  if (!path) return '#'
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
  const cleanBase = baseUrl.trim().replace(/\/api$/, '')
  return `${cleanBase}/${path.replace(/\\/g, '/')}`
}

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
        limit: 5,
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
        limit: 5,
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
    role: 'parent_agent'
  })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null
  })
  const [errors, setErrors] = useState({})

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
        setFormData({ name: '', email: '', phone: '', password: '', role: 'parent_agent' })
        setFiles({ aadharFront: null, aadharBack: null, panCard: null })
        setErrors({})
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Enrollment failed'
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
      else if (msg.toLowerCase().includes('phone')) setErrors({ phone: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const FileSlot = ({ label, id, currentFile }) => (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
      <label className={`relative group cursor-pointer flex items-center gap-2 p-2.5 bg-gray-50 border border-dash-2 border-gray-200 rounded-xl transition-all hover:bg-white hover:border-blue-300 ${currentFile ? 'bg-emerald-50/30 border-emerald-200 border-solid' : 'border-dashed'}`}>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${currentFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-gray-100 text-gray-300'}`}>
          {currentFile ? <CheckCircle size={14} /> : <FileText size={14} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[11px] font-bold truncate ${currentFile ? 'text-emerald-700' : 'text-gray-400'}`}>
            {currentFile ? currentFile.name : 'Select File'}
          </div>
          {currentFile && <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Ready for Vault</div>}
        </div>
        <input type="file" id={id} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, id)} />
      </label>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Agency"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 p-6 bg-slate-50/50">
          <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors pointer-events-auto">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            type="button"
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-primary-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 pointer-events-auto"
          >
            {loading ? <Loader size="sm" color="white" /> : <><Plus size={18} /> Add Agency</>}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-6 w-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500"><Users size={14} /></div>
              <h3 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Agency Information</h3>
            </div>
            <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 leading-none ${errors.name ? 'text-red-500' : 'text-gray-400'}`}>Full Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${errors.name ? 'border-red-500' : 'bg-white border-gray-200 focus:border-blue-500'}`} placeholder="Company or Individual Name" />
                {errors.name && <div className="text-[9px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</div>}
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 leading-none ${errors.email ? 'text-red-500' : 'text-gray-400'}`}>Email Address</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${errors.email ? 'border-red-500' : 'bg-white border-gray-200 focus:border-blue-500'}`} placeholder="contact@agency.com" />
                {errors.email && <div className="text-[9px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</div>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 leading-none ${errors.phone ? 'text-red-500' : 'text-gray-400'}`}>Phone Number</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${errors.phone ? 'border-red-500' : 'bg-white border-gray-200 focus:border-blue-500'}`} placeholder="+91" />
                  {errors.phone && <div className="text-[9px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.phone}</div>}
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 leading-none ${errors.password ? 'text-red-500' : 'text-gray-400'}`}>Password</label>
                  <input required type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${errors.password ? 'border-red-500' : 'bg-white border-gray-200 focus:border-blue-500'}`} placeholder="Min. 8 characters" />
                  {errors.password && <div className="text-[9px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.password}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Documents */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><ShieldCheck size={14} /></div>
              <h3 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">KYC Documents</h3>
            </div>
            <div className="flex flex-col justify-between h-auto min-h-[234px] space-y-3 p-5 rounded-2xl bg-emerald-50/10 border border-emerald-100/50">
              <div className="space-y-3">
                <FileSlot label="Aadhar Front" id="aadharFront" currentFile={files.aadharFront} />
                <FileSlot label="Aadhar Back" id="aadharBack" currentFile={files.aadharBack} />
                <FileSlot label="PAN Card" id="panCard" currentFile={files.panCard} />
              </div>
              <div className="flex items-start gap-2 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 text-emerald-800">
                <ShieldCheck size={12} className="mt-0.5 shrink-0" />
                <p className="text-[9px] font-bold uppercase tracking-tight leading-tight">Fast Track: Any agency you add here is approved automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Internal component for Edit Agency Modal
const EditAgencyModal = ({ isOpen, onClose, agent, onRefresh }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panCard: null
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
        phone: agent.phone || ''
      })
      setFiles({ aadharFront: null, aadharBack: null, panCard: null })
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
      title="Edit Agency Profile"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} type="button" className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
          <button form="edit-agency-form" type="submit" disabled={loading} className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader size="sm" color="white" /> : 'Update Agency'}
          </button>
        </div>
      }
    >
      <form id="edit-agency-form" onSubmit={handleSubmit} className="p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Identity & Contacts */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500"><Users size={16} /></div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 leading-none">Account Identity</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">Update core contact and branding data</p>
              </div>
            </div>

            <div className="space-y-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 leading-none ${errors.name ? 'text-red-500' : 'text-gray-400'}`}>Agency Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${errors.name ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'}`} placeholder="Company Name" />
                {errors.name && <div className="text-[9px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</div>}
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 leading-none ${errors.email ? 'text-red-500' : 'text-gray-400'}`}>Email Address</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'}`} placeholder="contact@agency.com" />
                {errors.email && <div className="text-[9px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</div>}
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 leading-none ${errors.phone ? 'text-red-500' : 'text-gray-400'}`}>Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'}`} placeholder="+91" />
                {errors.phone && <div className="text-[9px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.phone}</div>}
              </div>
            </div>
          </div>

          {/* Section 2: Documents */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm"><ShieldCheck size={16} /></div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 leading-none">Compliance Vault</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">Update and refresh identity documentation</p>
              </div>
            </div>

            <div className="space-y-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
              {[
                { id: 'aadharFront', label: 'Aadhar Front Identity', icon: FileText },
                { id: 'aadharBack', label: 'Aadhar Back Identity', icon: FileText },
                { id: 'panCard', label: 'PAN Card Verification', icon: ShieldCheck }
              ].map((doc) => {
                const existingUrl = agent?.kyc?.[doc.id];
                const newFile = files[doc.id];

                return (
                  <div key={doc.id}>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 leading-none">{doc.label}</label>
                    <div className="relative group">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, doc.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept="image/*"
                      />
                      <div className={`w-full h-auto min-h-[48px] border border-dashed rounded-lg flex flex-col p-3 transition-all ${newFile ? 'border-emerald-200 bg-emerald-50/30' : existingUrl ? 'border-blue-100 bg-blue-50/20' : 'border-gray-200 bg-gray-50/30 group-hover:border-blue-400 group-hover:bg-white'}`}>
                        <div className="flex items-center gap-3">
                          {newFile ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : existingUrl ? (
                            <FileCheck size={14} className="text-blue-500" />
                          ) : (
                            <doc.icon size={14} className="text-gray-300" />
                          )}
                          <span className={`text-xs font-bold truncate flex-1 ${(newFile || existingUrl) ? 'text-zinc-900' : 'text-gray-400'}`}>
                            {newFile ? newFile.name : existingUrl ? 'Registry Document Loaded' : `Update ${doc.label.split(' ')[0]}...`}
                          </span>
                          <div className="flex items-center gap-2">
                            {existingUrl && (
                              <a
                                href={getFileUrl(existingUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="h-6 w-6 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-primary-600 rounded-md transition-all shadow-sm z-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                            <Plus size={14} className={newFile ? 'text-emerald-400' : 'text-gray-300'} />
                          </div>
                        </div>

                        {/* Preview Section */}
                        {(newFile || existingUrl) && (
                          <div className="mt-3 relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-gray-100 bg-white group/preview">
                            <img
                              src={newFile ? URL.createObjectURL(newFile) : getFileUrl(existingUrl)}
                              alt={doc.label}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-zinc-900/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                Click Card to Update
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // KYC Modal State
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isKycModalOpen, setIsKycModalOpen] = useState(false)

  // Hierarchy Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAgency, setEditingAgency] = useState(null)

  const [rejectionReason, setRejectionReason] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        role: 'parent_agent', // Only Main View for Parents
        isActive: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? 'true' : 'false'),
        search: debouncedSearch || undefined
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to fetch agencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [page, debouncedSearch, statusFilter])

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
    try {
      const { data } = await adminApi.toggleAgent(id)
      if (data.success) {
        toast.success(data.message)
        fetchAgents()
      }
    } catch (error) {
      toast.error('Failed to toggle agent status')
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
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Parent Agencies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage tier-1 travel distribution entities and corporate identities
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 sm:w-auto sm:self-auto"
        >
          <Plus size={18} strokeWidth={2} />
          Add Agency
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search agencies..."
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-full"
              buttonClassName="!py-2"
            />
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
            <p className="mt-1 text-sm text-gray-500">Try adjusting search or status.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Parent agency</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Child network</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Contact</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">KYC</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((agent) => (
                  <tr key={agent._id} className="group transition-colors hover:bg-gray-50/80">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform"><Building2 className="h-4.5 w-4.5 text-slate-500" /></div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate max-w-[160px] leading-tight">{agent.name}</div>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 leading-none"><Mail className="w-2.5 h-2.5" /> {agent.email}</div>
                            <div className="text-[9px] font-black text-primary-600 uppercase tracking-widest leading-none mt-0.5 flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> {agent.agentCode || 'NO-CODE'}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <button
                        onClick={() => navigate(`/admin/agencies/network/${agent._id}`)}
                        className="group/h flex items-center gap-2"
                      >
                        <div className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 transition-all group-hover/h:bg-primary-50 group-hover/h:border-primary-200 group-hover/h:shadow-sm">
                          <Users size={14} className="text-slate-400 group-hover/h:text-primary-600 transition-colors" />
                          <span className="text-xs font-black text-slate-900">{agent.childCount || 0}</span>
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse hidden group-hover/h:block" />
                        </div>
                        <div className="p-1 px-1.5 rounded bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover/h:opacity-100 transition-all flex items-center gap-1 translate-x-[-10px] group-hover/h:translate-x-0">
                          Explore <ArrowRight size={8} />
                        </div>
                      </button>
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
                        onClick={() => handleToggleAgent(agent._id)}
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 min-w-[85px] border shadow-sm ${agent.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 hover:shadow-emerald-500/10'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/80 hover:shadow-red-500/10'
                          }`}
                      >
                        <div className={`w-1 h-1 rounded-full ${agent.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent)
                          setIsKycModalOpen(true)
                        }}
                        className="transition-transform active:scale-95"
                      >
                        {getStatusBadge(agent.kyc?.status)}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAgent(agent)
                            setIsKycModalOpen(true)
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all border border-slate-100 hover:border-primary-100 shadow-sm active:scale-90"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingAgency(agent)
                            setIsEditModalOpen(true)
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all border border-slate-100 hover:border-emerald-100 shadow-sm active:scale-90"
                          title="Edit Profile"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all border border-slate-100 hover:border-rose-100 shadow-sm active:scale-90"
                          title="Terminate Agency"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Page <span className="font-medium text-gray-900">{page}</span> of{' '}
                  <span className="font-medium text-gray-900">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
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

      {/* KYC Review Modal */}
      <Modal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        title={selectedAgent ? `KYC Review: ${selectedAgent.name}` : 'KYC Review'}
        size="lg"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-inner">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Corporate Identity</label>
                <div className="text-lg font-bold text-slate-900 tracking-tight leading-none">{selectedAgent.name}</div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent Professional Code</label>
                <div className="text-sm font-black text-primary-600 flex items-center gap-2"><ShieldCheck size={14} className="text-primary-500" /> {selectedAgent.agentCode || 'PENDING ASSIGNMENT'}</div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit State</label>
                <div>{getStatusBadge(selectedAgent.kyc?.status)}</div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 md:border-0 md:pt-0">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Primary</label>
                <div className="text-sm font-bold text-slate-700 flex items-center gap-2 font-mono">{selectedAgent.email}</div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 md:border-0 md:pt-0">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Phone Identity</label>
                <div className="text-sm font-bold text-slate-700 tracking-tighter">{selectedAgent.phone || 'N/A'}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><FileText size={16} className="text-primary-500" /> Credentials Vault</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Aadhar Front', path: selectedAgent.kyc?.aadharFront },
                  { label: 'Aadhar Back', path: selectedAgent.kyc?.aadharBack },
                  { label: 'Pan Card', path: selectedAgent.kyc?.panCard }
                ].map((doc, idx) => doc.path ? (
                  <div key={idx} className="group relative rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-[4/3] flex items-center justify-center p-2 bg-slate-50">
                      {doc.path.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                        <img src={getFileUrl(doc.path)} className="h-full w-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-500" />
                      ) : <FileText size={32} className="text-slate-200" />}
                    </div>
                    <div className="p-3 bg-white border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.label}</span>
                      <a href={getFileUrl(doc.path)} target="_blank" rel="noreferrer" className="h-7 w-7 flex items-center justify-center bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm"><ExternalLink size={12} /></a>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="aspect-[4/3] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 text-slate-300">
                    <XCircle size={24} className="opacity-20" />
                    <span className="text-[9px] font-black uppercase mt-2">{doc.label} Missing</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedAgent.kyc?.status === 'pending' && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Compliance Audit Feedback</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 bg-slate-50/50 transition-all min-h-[100px] resize-none"
                    placeholder="Provide specific reasons for compliance failure..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleKycAction('approve')}
                    disabled={isActionLoading}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader size="sm" color="white" /> : <><ShieldCheck size={18} /> Approve Agency</>}
                  </button>
                  <button
                    onClick={() => handleKycAction('reject')}
                    disabled={isActionLoading}
                    className="flex-1 h-12 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader size="sm" /> : <><ShieldAlert size={18} /> Reject Credentials</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
