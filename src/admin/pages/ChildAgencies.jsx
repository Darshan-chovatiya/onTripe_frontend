import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  GitBranch,
  Layers,
  Mail,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'
import Modal from '@/shared/components/Modal.jsx'
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

// Same KYC doc row as parent agencies page
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

  const isNewPdf = Boolean(newFile && (newFile.type === 'application/pdf' || newFile.name?.toLowerCase().endsWith('.pdf')))

  useEffect(() => {
    if (newFile && isNewPdf) {
      const u = URL.createObjectURL(newFile)
      setPdfBlobUrl(u)
      return () => { URL.revokeObjectURL(u); setPdfBlobUrl(null) }
    }
    setPdfBlobUrl(null)
    return undefined
  }, [newFile, isNewPdf])

  const serverUrl = existingUrl && !newFile ? getFileUrl(existingUrl) : null
  const displayUrl = blobUrl || serverUrl
  const isExistingPdf = existingUrl && !newFile && isPdfPath(existingUrl)
  const showImage = displayUrl && (newFile ? newFile.type?.startsWith('image/') : existingUrl && !isPdfPath(existingUrl))

  return (
    <div>
      <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">{doc.label}</label>
      <div className="relative rounded-xl border border-dashed border-gray-200 bg-gray-50/50 transition-colors hover:border-gray-300 hover:bg-white">
        <input type="file" onChange={onFileChange} className="absolute inset-0 z-10 cursor-pointer opacity-0" accept={accept || 'image/*,.pdf,application/pdf'} />
        <div className="p-3">
          <div className="flex items-center gap-3">
            {newFile ? <CheckCircle size={16} className="shrink-0 text-gray-700" strokeWidth={2} />
              : existingUrl ? <FileCheck size={16} className="shrink-0 text-gray-600" strokeWidth={2} />
              : <FileText size={16} className="shrink-0 text-gray-300" strokeWidth={2} />}
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800">
              {newFile ? newFile.name : existingUrl ? 'Document on file click to replace' : 'Click to upload'}
            </span>
            {existingUrl && (
              <a href={getFileUrl(existingUrl)} target="_blank" rel="noreferrer"
                className="relative z-20 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-gray-800"
                onClick={e => e.stopPropagation()} title="Open in new tab">
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
              {pdfBlobUrl && <a href={pdfBlobUrl} target="_blank" rel="noreferrer" className="shrink-0 font-medium text-gray-700 hover:underline">Open</a>}
              {!pdfBlobUrl && serverUrl && isExistingPdf && <a href={serverUrl} target="_blank" rel="noreferrer" className="shrink-0 font-medium text-gray-700 hover:underline">Open</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// FileSlot for Add modal (same as parent agencies)
const FileSlot = ({ label, id, currentFile, accept, hasError, onFileChange }) => {
  const [previewUrl, setPreviewUrl] = useState(null)
  useEffect(() => {
    if (!currentFile) { setPreviewUrl(null); return }
    if (currentFile.type?.startsWith('image/')) {
      const url = URL.createObjectURL(currentFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
    return undefined
  }, [currentFile])
  const isPdf = currentFile && (currentFile.type === 'application/pdf' || currentFile.name?.toLowerCase().endsWith('.pdf'))
  return (
    <div className="min-w-0 space-y-2">
      <label className={`ml-1 block text-[10px] font-semibold uppercase tracking-wide ${hasError ? 'text-red-500' : 'text-gray-500'}`}>{label}</label>
      <label htmlFor={id} className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors ${
        currentFile ? 'border-gray-300 bg-gray-50' : hasError ? 'border-dashed border-red-300 bg-red-50 hover:border-red-400 hover:bg-white' : 'border-dashed border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${currentFile ? 'bg-gray-200 text-gray-700' : 'border border-gray-100 bg-white text-gray-400'}`}>
            {currentFile ? <CheckCircle size={16} strokeWidth={2} /> : <FileText size={16} strokeWidth={2} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`truncate text-xs font-medium ${currentFile ? 'text-gray-900' : 'text-gray-500'}`}>
              {currentFile ? currentFile.name : 'Click to upload'}
            </div>
            {currentFile && <div className="mt-0.5 text-[10px] font-medium text-gray-600">Ready to submit</div>}
          </div>
        </div>
        {previewUrl && <div className="overflow-hidden rounded-lg border border-gray-200 bg-white"><img src={previewUrl} alt="" className="max-h-40 w-full object-contain" /></div>}
        {currentFile && isPdf && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">
            <FileText className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate font-medium">{currentFile.name}</span>
            <span className="text-gray-400">(PDF)</span>
          </div>
        )}
        <input type="file" id={id} className="sr-only" accept={accept || 'image/*,.pdf,application/pdf'} onChange={onFileChange} />
      </label>
      {hasError && <div className="ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {hasError}</div>}
    </div>
  )
}

function AgentFormModal({ mode, agent, agentRole, onClose, onSaved }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const existingParentId = agent?.parentRef || agent?.approvedParents?.[0] || ''

  const [form, setForm] = useState({
    name: agent?.name || '',
    email: agent?.email || '',
    phone: agent?.phone || '',
    password: '',
    parentRef: existingParentId,
    kycStatus: agent?.kyc?.status || 'approved',
    kycRejectionReason: agent?.kyc?.rejectionReason || '',
    gstNumber: agent?.gstNumber || '',
    address: agent?.address || '',
    contactPersonName: agent?.contactPersonName || '',
  })
  const [parentSearch, setParentSearch] = useState('')
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false)
  const [parentOptions, setParentOptions] = useState([])
  const [parentsLoading, setParentsLoading] = useState(false)
  const parentDropdownRef = useRef(null)

  const [files, setFiles] = useState({ agencyLogo: null, aadharFront: null, aadharBack: null, panCard: null })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const load = async () => {
      setParentsLoading(true)
      try {
        const [parentRes, childRes] = await Promise.all([
          adminApi.listAgents({ role: 'parent_agent', limit: 200 }),
          adminApi.listAgents({ role: 'child_agent', limit: 200 })
        ])
        
        const parents = parentRes.data?.success ? parentRes.data.data.agents : []
        const children = childRes.data?.success ? childRes.data.data.agents : []
        const combined = [...parents, ...children]
        
        setParentOptions(combined.map(a => ({ 
          value: a._id, 
          label: `${a.name} (${a.role === 'parent_agent' ? 'Parent' : 'Child'})`, 
          code: a.agentCode 
        })))
      } catch { /* silent */ }
      finally { setParentsLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(e.target))
        setParentDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const selectedParent = parentOptions.find(o => o.value === form.parentRef) || null
  const filteredParents = parentOptions.filter(o =>
    o.label.toLowerCase().includes(parentSearch.toLowerCase()) ||
    (o.code || '').toLowerCase().includes(parentSearch.toLowerCase())
  )

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Agency name is required'
    else if (form.name.trim().length < 3) e.name = 'Name must be at least 3 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) e.email = 'Please enter a valid email'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Must be exactly 10 digits'
    if (!form.contactPersonName.trim()) e.contactPersonName = 'Business name is required'
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!form.gstNumber.trim()) e.gstNumber = 'GST number is required'
    else if (!gstRegex.test(form.gstNumber.trim().toUpperCase())) e.gstNumber = 'Invalid GST number. Format: 22AAAAA0000A1Z5'
    if (!form.address.trim()) e.address = 'Business address is required'
    if (mode === 'add') {
      if (!form.password) e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Minimum 8 characters'
      if (!form.parentRef) e.parentRef = `${parentLabel} is required`
      if (!files.agencyLogo) e.agencyLogo = 'Agency logo is required'
      if (!files.aadharFront) e.aadharFront = 'Aadhar front is required'
      if (!files.aadharBack) e.aadharBack = 'Aadhar back is required'
      if (!files.panCard) e.panCard = 'PAN card is required'
    } else if (form.password && form.password.length < 8) {
      e.password = 'Minimum 8 characters'
    }
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleFileInputChange = (e, key) => {
    const file = e.target.files[0]
    if (file) setFiles(p => ({ ...p, [key]: file }))
  }

  const handleSubmit = async () => {
    if (!validate()) return
    
    // Validate rejection reason is required when status is rejected
    if (form.kycStatus === 'rejected' && !form.kycRejectionReason.trim()) {
      toast.error('Rejection reason is required when rejecting KYC')
      return
    }
    
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('email', form.email.trim())
      fd.append('phone', form.phone.trim())
      if (form.password) fd.append('password', form.password)
      if (form.parentRef) fd.append('parentRef', form.parentRef)
      fd.append('kycStatus', form.kycStatus)
      if (form.kycStatus === 'rejected' && form.kycRejectionReason)
        fd.append('kycRejectionReason', form.kycRejectionReason)
      fd.append('gstNumber', form.gstNumber)
      fd.append('address', form.address)
      fd.append('contactPersonName', form.contactPersonName)
      if (mode === 'add') fd.append('role', agentRole)
      Object.keys(files).forEach(k => { if (files[k]) fd.append(k, files[k]) })

      const res = mode === 'add'
        ? await adminApi.createAgent(fd)
        : await adminApi.updateAgent(agent._id, fd)

      if (res?.data?.success) {
        toast.success(mode === 'add' ? 'Agency created successfully' : 'Agency updated successfully')
        onSaved()
      } else {
        toast.error(res?.data?.message || 'Operation failed')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Operation failed'
      if (msg.toLowerCase().includes('email')) setErrors(p => ({ ...p, email: msg }))
      else if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('mobile')) setErrors(p => ({ ...p, phone: msg }))

      if (msg.includes('E11000')) {
        toast.error('Identity already exists (email or phone)')
      } else {
        toast.error(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const isEdit = mode === 'edit'
  const parentLabel = agentRole === 'sub_child_agent' ? 'Child agency' : 'Parent agency'
  const agencyLabel = agentRole === 'sub_child_agent' ? 'Sub-child' : 'Child'

  const FileSlot = ({ label, id, currentFile, accept, hasError }) => {
    const [previewUrl, setPreviewUrl] = useState(null)
    useEffect(() => {
      if (!currentFile) { setPreviewUrl(null); return }
      if (currentFile.type?.startsWith('image/')) {
        const url = URL.createObjectURL(currentFile)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
      }
      setPreviewUrl(null)
      return undefined
    }, [currentFile])
    const isPdf = currentFile && (currentFile.type === 'application/pdf' || currentFile.name?.toLowerCase().endsWith('.pdf'))
    return (
      <div className="min-w-0 space-y-2">
        <label className={`ml-1 block text-[10px] font-semibold uppercase tracking-wide ${hasError ? 'text-red-500' : 'text-gray-500'}`}>{label}</label>
        <label htmlFor={id} className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors ${
          currentFile ? 'border-gray-300 bg-gray-50' : hasError ? 'border-dashed border-red-300 bg-red-50 hover:border-red-400 hover:bg-white' : 'border-dashed border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${currentFile ? 'bg-gray-200 text-gray-700' : 'border border-gray-100 bg-white text-gray-400'}`}>
              {currentFile ? <CheckCircle size={16} strokeWidth={2} /> : <FileText size={16} strokeWidth={2} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-xs font-medium ${currentFile ? 'text-gray-900' : 'text-gray-500'}`}>
                {currentFile ? currentFile.name : 'Click to upload'}
              </div>
              {currentFile && <div className="mt-0.5 text-[10px] font-medium text-gray-600">Ready to submit</div>}
            </div>
          </div>
          {previewUrl && <div className="overflow-hidden rounded-lg border border-gray-200 bg-white"><img src={previewUrl} alt="" className="max-h-40 w-full object-contain" /></div>}
          {currentFile && isPdf && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">
              <FileText className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate font-medium">{currentFile.name}</span>
              <span className="text-gray-400">(PDF)</span>
            </div>
          )}
          <input type="file" id={id} className="sr-only" accept={accept || 'image/*,.pdf,application/pdf'} onChange={e => handleFileInputChange(e, id)} />
        </label>
        {hasError && <div className="ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {hasError}</div>}
      </div>
    )
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Edit ${agent.name}` : `Add ${agencyLabel} agency`}
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-4 sm:px-6 py-4">
          <button type="button" onClick={onClose} className="w-full sm:w-auto rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving || (form.kycStatus === 'rejected' && !form.kycRejectionReason.trim())}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50"
            title={form.kycStatus === 'rejected' && !form.kycRejectionReason.trim() ? 'Rejection reason is required' : ''}>
            {saving ? <Loader size="sm" color="white" /> : isEdit ? <><Save size={16} strokeWidth={2} /> Save changes</> : <><Plus size={16} strokeWidth={2} /> Add agency</>}
          </button>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-4xl space-y-5 px-1 py-1">

        {/* Agency details section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
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
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.name ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`}
                placeholder="Company or individual name" />
              {errors.name && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.name}</div>}
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.email ? 'text-red-500' : 'text-gray-600'}`}>Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.email ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`}
                placeholder="contact@agency.com" />
              {errors.email && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.email}</div>}
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.phone ? 'text-red-500' : 'text-gray-600'}`}>Mobile <span className="text-red-500">*</span></label>
              <input type="tel" maxLength={10} value={form.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.phone ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`}
                placeholder="10-digit number" />
              {errors.phone && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.phone}</div>}
            </div>
            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.password ? 'text-red-500' : 'text-gray-600'}`}>
                Password {mode === 'add' ? <span className="text-red-500">*</span> : <span className="font-normal text-gray-400">(leave blank to keep)</span>}
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                  className={`h-11 w-full rounded-xl border px-4 pr-11 text-sm outline-none transition ${errors.password ? 'border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`}
                  placeholder="Minimum 8 characters" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.password}</div>}
            </div>

            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.contactPersonName ? 'text-red-500' : 'text-gray-600'}`}>Business Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.contactPersonName} onChange={e => set('contactPersonName', e.target.value)} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.contactPersonName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="Registered business name" />
              {errors.contactPersonName && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.contactPersonName}</div>}
            </div>

            <div>
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.gstNumber ? 'text-red-500' : 'text-gray-600'}`}>GST number <span className="text-red-500">*</span></label>
              <input type="text" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value.toUpperCase())} maxLength={15} className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition ${errors.gstNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="22AAAAA0000A1Z5" />
              {errors.gstNumber && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.gstNumber}</div>}
            </div>

            <div className="sm:col-span-2">
              <label className={`mb-1.5 ml-1 block text-xs font-medium ${errors.address ? 'text-red-500' : 'text-gray-600'}`}>Business Address <span className="text-red-500">*</span></label>
              <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} className={`w-full resize-y rounded-xl border px-4 py-2.5 text-sm outline-none ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'}`} placeholder="Complete office address" />
              {errors.address && <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={11} /> {errors.address}</div>}
            </div>
          </div>
        </section>

        {/* Parent agency section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <GitBranch size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{parentLabel}</h3>
              <p className="text-xs text-gray-500">
                Assign this agency under a {parentLabel.toLowerCase()}
                {mode === 'add' && <span className="text-red-500"> *</span>}
              </p>
            </div>
          </div>
          <div className="relative" ref={parentDropdownRef}>
            <button type="button" onClick={() => { setParentDropdownOpen(v => !v); setParentSearch('') }}
              className={`flex h-11 w-full items-center gap-2 rounded-xl border px-4 text-sm transition ${
                errors.parentRef ? 'border-red-400 bg-red-50' :
                parentDropdownOpen ? 'border-gray-400 bg-white' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
              }`}>
              <Building2 className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
              {selectedParent ? (
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium text-gray-900">{selectedParent.label}</span>
                  {selectedParent.code && <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">{selectedParent.code}</span>}
                </span>
              ) : (
                <span className="flex-1 text-left text-gray-400">{parentsLoading ? 'Loading' : `Select ${parentLabel}`}</span>
              )}
              <div className="flex shrink-0 items-center gap-1">
                {selectedParent && (
                  <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); set('parentRef', '') }}
                    onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), set('parentRef', ''))}
                    className="rounded p-0.5 text-gray-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                )}
                <svg className={`h-4 w-4 text-gray-400 transition-transform ${parentDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {parentDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-100 p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <input autoFocus type="text" value={parentSearch} onChange={e => setParentSearch(e.target.value)}
                      placeholder="Search by name or code"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none" />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button type="button" onClick={() => { set('parentRef', ''); setParentDropdownOpen(false) }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 ${!form.parentRef ? 'bg-gray-50 font-medium text-gray-700' : 'text-gray-400'}`}>
                    <span className="italic">No parent assigned</span>
                  </button>
                  {parentsLoading ? (
                    <div className="flex items-center justify-center py-6 text-xs text-gray-400">Loading..</div>
                  ) : filteredParents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">No results found</div>
                  ) : filteredParents.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => { set('parentRef', opt.value); setParentDropdownOpen(false); setParentSearch(''); setErrors(p => ({ ...p, parentRef: undefined })) }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${form.parentRef === opt.value ? 'bg-gray-50' : ''}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${form.parentRef === opt.value ? 'border-gray-300 bg-gray-100 text-gray-700' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                        <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-semibold text-gray-900">{opt.label}</p>
                          <span className="shrink-0 rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight text-emerald-700">Approved</span>
                        </div>
                        {opt.code && <p className="mt-0.5 font-mono text-[10px] text-gray-400">{opt.code}</p>}
                      </div>
                      {form.parentRef === opt.value && <CheckCircle className="h-4 w-4 shrink-0 text-gray-700" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {errors.parentRef && (
            <div className="mt-2 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
              <AlertCircle size={11} /> {errors.parentRef}
            </div>
          )}
        </section>

        {/* KYC documents section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ShieldCheck size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">KYC documents &amp; status</h3>
              <p className="text-xs text-gray-500">Upload documents and set verification status</p>
            </div>
          </div>
          {isEdit ? (
            <div className="space-y-4">
              {/* KYC status + rejection reason */}
              <div className="mb-4 max-w-xs">
                <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">KYC status</label>
                <CustomDropdown
                  value={form.kycStatus}
                  onChange={v => set('kycStatus', v)}
                  options={[
                    { value: 'approved', label: 'Approved' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                  className="w-full"
                  buttonClassName="!py-2.5"
                />
              </div>
              {form.kycStatus === 'rejected' && (
                <div className="mb-4">
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-gray-600">Rejection reason <span className="text-red-600">*</span></label>
                  <textarea
                    value={form.kycRejectionReason}
                    onChange={e => set('kycRejectionReason', e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:bg-white"
                  />
                </div>
              )}
              <div className="mb-4 max-w-md">
                <EditKycDocRow doc={{ label: 'Agency logo' }} existingUrl={agent?.agencyLogo}
                  newFile={files.agencyLogo} onFileChange={e => setFiles(p => ({ ...p, agencyLogo: e.target.files[0] || null }))}
                  accept="image/jpeg,image/png,image/webp" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <EditKycDocRow doc={{ label: 'Aadhar front' }} existingUrl={agent?.kyc?.aadharFront}
                  newFile={files.aadharFront} onFileChange={e => setFiles(p => ({ ...p, aadharFront: e.target.files[0] || null }))} />
                <EditKycDocRow doc={{ label: 'Aadhar back' }} existingUrl={agent?.kyc?.aadharBack}
                  newFile={files.aadharBack} onFileChange={e => setFiles(p => ({ ...p, aadharBack: e.target.files[0] || null }))} />
                <EditKycDocRow doc={{ label: 'PAN card' }} existingUrl={agent?.kyc?.panCard}
                  newFile={files.panCard} onFileChange={e => setFiles(p => ({ ...p, panCard: e.target.files[0] || null }))} />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FileSlot label="Aadhar front *" id="aadharFront" currentFile={files.aadharFront} hasError={errors.aadharFront} />
                <FileSlot label="Aadhar back *" id="aadharBack" currentFile={files.aadharBack} hasError={errors.aadharBack} />
                <FileSlot label="PAN card *" id="panCard" currentFile={files.panCard} hasError={errors.panCard} />
              </div>
              {(errors.aadharFront || errors.aadharBack || errors.panCard) && (
                <div className="mt-2 ml-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
                  <AlertCircle size={11} /> Aadhar front, Aadhar back and PAN card are required
                </div>
              )}
              <div className="mt-4 max-w-md">
                <FileSlot label="Agency logo *" id="agencyLogo" currentFile={files.agencyLogo}
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hasError={errors.agencyLogo} />
              </div>
            </>
          )}
        </section>
      </div>
    </Modal>
  )
}

function ParentApprovalBadge({ status }) {
  if (!status || status === 'none') return null
  const cfg = {
    approved:  { label: 'Approved', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    pending:   { label: 'Pending', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
    rejected:  { label: 'Rejected', cls: 'border-red-200 bg-red-50 text-red-800' },
  }
  const { label, cls } = cfg[status] || cfg.pending
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

export default function ChildAgencies({ agentRole = 'child_agent', pageTitle = 'Child Agencies' }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialParentRef = searchParams.get('parentRef')
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')
  const [parentFilter, setParentFilter] = useState(initialParentRef || 'all')
  const [parentOptions, setParentOptions] = useState([{ value: 'all', label: 'All parents' }])
  const [togglingId, setTogglingId] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [hierarchyModal, setHierarchyModal] = useState({ open: false, agentId: null, title: '' })

  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Add / Edit modal state
  const [agentFormModal, setAgentFormModal] = useState({ open: false, mode: 'add', agent: null })

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchQuery) }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useLayoutEffect(() => {
    const parentRefFromUrl = searchParams.get('parentRef')
    setParentFilter(parentRefFromUrl || 'all')
  }, [agentRole, searchParams])

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, kycFilter, parentFilter, agentRole])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = {
        page, limit: 10, role: agentRole,
        isActive: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? 'true' : 'false'),
        search: debouncedSearch || undefined,
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
        parentRef: parentFilter === 'all' ? undefined : parentFilter,
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
        setTotal(data.data.totalCount ?? 0)
      }
    } catch {
      toast.error(`Failed to fetch agencies`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAgents() }, [page, debouncedSearch, statusFilter, kycFilter, parentFilter, agentRole])

  useEffect(() => {
    const loadParents = async () => {
      try {
        const roleForParents = agentRole === 'sub_child_agent' ? 'child_agent' : 'parent_agent'
        const { data } = await adminApi.listAgents({ role: roleForParents, limit: 1000 })
        if (data?.success) {
          const opts = [
            { value: 'all', label: agentRole === 'sub_child_agent' ? 'All child agencies' : 'All parents' },
            ...data.data.agents.map((a) => ({ 
              value: a._id, 
              label: `${a.name}${a.agentCode ? ` (${a.agentCode})` : ''}` 
            })),
          ]
          setParentOptions(opts)
        }
      } catch {
        setParentOptions([{ value: 'all', label: 'All parents' }])
      }
    }
    loadParents()
  }, [agentRole])

  const handleToggleStatus = async (agentId) => {
    if (togglingId) return
    setTogglingId(agentId)
    try {
      const { data } = await adminApi.toggleAgent(agentId)
      if (data.success) { toast.success(data.message); fetchAgents() }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setTogglingId(null)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
      pending:  { icon: Clock,        color: 'bg-amber-50 text-amber-700 border-amber-200',   label: 'Pending' },
      rejected: { icon: XCircle,      color: 'bg-red-50 text-red-700 border-red-200',         label: 'Rejected' },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border min-w-[90px] shadow-sm ${badge.color}`}>
        <Icon className="w-3 h-3" />{badge.label}
      </span>
    )
  }
  
  const handleKycAction = async (action) => {
    if (isActionLoading) return
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    setIsActionLoading(true)
    try {
      const res = action === 'approve'
        ? await adminApi.approveKyc(selectedAgent._id)
        : await adminApi.rejectKyc(selectedAgent._id, rejectionReason.trim())
      if (res.data.success) {
        toast.success(res.data.message)
        setIsDetailModalOpen(false)
        setRejectionReason('')
        fetchAgents()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setIsActionLoading(false)
    }
  }

  const customersPathForAgent = (id) => `/admin/child-agencies/${id}/customers`

  const AgentDetailModal = () => {
    const parents = selectedAgent
      ? (Array.isArray(selectedAgent.allParents) && selectedAgent.allParents.length > 0
          ? selectedAgent.allParents
          : selectedAgent.parentName
            ? [{ name: selectedAgent.parentName, agentCode: selectedAgent.parentCode }]
            : [])
      : []

    return (
      <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setRejectionReason('') }} title="Agency overview" size="md">
        {selectedAgent && (
          <div className="divide-y divide-gray-100">

            {/* â”€â”€ Header + Network side by side â”€â”€ */}
            <div className="flex flex-col sm:flex-row items-start gap-4 px-4 sm:px-6 py-4">
              {/* Left: avatar + name + label + status */}
              <div className="flex w-full sm:min-w-0 sm:flex-1 items-start gap-3">
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
                  <p className="mt-0.5 text-xs text-gray-400">Agency details</p>
                  <span className={`mt-1.5 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${selectedAgent.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedAgent.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {selectedAgent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Right: network stats column */}
              <div className="w-full sm:w-auto shrink-0 space-y-1.5 sm:min-w-[140px]">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500">Sub-agents</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{selectedAgent.childCount ?? 0}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsDetailModalOpen(false); navigate(`/admin/child-agencies/${selectedAgent._id}/whitelabels`) }}
                  className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2 transition-colors hover:border-primary-200 hover:bg-primary-50/50"
                >
                  <span className="text-xs font-medium text-gray-500">Whitelabels</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{selectedAgent.whitelabelCount ?? 0}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsDetailModalOpen(false); navigate(customersPathForAgent(selectedAgent._id)) }}
                  className="flex w-full items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2 transition-colors hover:border-primary-200 hover:bg-primary-50/50"
                >
                  <span className="text-xs font-medium text-gray-500">Customers</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{selectedAgent.customerCount ?? 0}</span>
                </button>
              </div>
            </div>

            {/* â”€â”€ Details â”€â”€ */}
            <div className="px-4 sm:px-6 py-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Details</p>

              {/* Row 1: agent code Â· parent/child agencies Â· KYC status */}
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-gray-400">Agent code</p>
                  <p className="mt-0.5 text-sm font-semibold text-primary-700">{selectedAgent.agentCode || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Parent agency</p>
                  {parents.length === 0 ? (
                    <p className="mt-0.5 text-sm text-gray-400">—</p>
                  ) : (
                    <div className="mt-0.5 space-y-0.5">
                      {parents.map((p, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900">{p.name}</span>
                          {p.agentCode && <span className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[10px] text-primary-700">{p.agentCode}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">KYC status</p>
                  <div className="mt-1">{getStatusBadge(selectedAgent.kyc?.status)}</div>
                </div>
              </div>

              {/* Row 2: email Â· phone */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-400">Email</p>
                  <p className="mt-0.5 break-all text-sm text-gray-900">{selectedAgent.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Phone</p>
                  <p className="mt-0.5 text-sm text-gray-900">{selectedAgent.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Business Name</p>
                  <p className="mt-0.5 text-sm text-gray-900">{selectedAgent.contactPersonName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">GST number</p>
                  <p className="mt-0.5 text-sm text-gray-900">{selectedAgent.gstNumber || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-gray-400">Address</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">{selectedAgent.address || '—'}</p>
                </div>
              </div>

              {selectedAgent.kyc?.status === 'rejected' && selectedAgent.kyc?.rejectionReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-xs font-semibold text-red-700">Rejection reason</p>
                  <p className="mt-0.5 text-xs text-red-600">{selectedAgent.kyc.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* ── KYC documents ── */}
            <div className="px-4 sm:px-6 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">KYC documents</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Aadhar front', path: selectedAgent.kyc?.aadharFront },
                  { label: 'Aadhar back', path: selectedAgent.kyc?.aadharBack },
                  { label: 'PAN card', path: selectedAgent.kyc?.panCard },
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
                          <img src={getFileUrl(doc.path)} alt={doc.label} className="max-h-40 w-full object-cover" />
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
              <div className="px-4 sm:px-6 py-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} /> Previous submissions
                </p>
                <div className="space-y-2">
                  {selectedAgent.kycHistory.map((h, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">{new Date(h.submittedAt || Date.now()).toLocaleDateString()}</span>
                        <ParentApprovalBadge status={h.status} />
                      </div>
                      {h.rejectionReason && (
                        <p className="mb-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs text-red-600">
                          <span className="font-semibold">Reason: </span>{h.rejectionReason}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          ['aadharFront', 'Aadhar front'],
                          ['aadharBack', 'Aadhar back'],
                          ['panCard', 'PAN card']
                        ].map(([key, lbl]) => h[key] ? (
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

            {/* â”€â”€ KYC actions (pending only) â”€â”€ */}
            {selectedAgent.kyc?.status === 'pending' && (
              <div className="px-4 sm:px-6 py-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Review KYC</p>
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-gray-600" htmlFor="kyc-reject-reason-child">
                    Rejection reason <span className="text-gray-400">(required to reject)</span>
                  </label>
                  <textarea
                    id="kyc-reject-reason-child"
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
    )
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listAgents({
        role: agentRole, limit: 10000, page: 1,
        isActive: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? 'true' : 'false'),
        search: debouncedSearch || undefined,
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
        parentRef: parentFilter === 'all' ? undefined : parentFilter,
      })
      const isSubChild = agentRole === 'sub_child_agent'
      await exportToExcel(
        (data?.data?.agents ?? []).map((a) => {
          const parents = Array.isArray(a.allParents) && a.allParents.length > 0
            ? a.allParents
            : a.parentName ? [{ name: a.parentName, agentCode: a.parentCode, email: a.parentEmail }] : []
          const parentCols = {}
          parents.forEach((p, i) => {
            const label = isSubChild ? `Child Agency ${i + 1}` : `Parent Agency ${i + 1}`
            parentCols[label] = p.name || ''
            parentCols[`${label} Code`] = p.agentCode || ''
            parentCols[`${label} Email`] = p.email || ''
          })
          return {
            Name: a.name, Email: a.email, Phone: a.phone || '',
            'Agent Code': a.agentCode || '',
            ...parentCols,
            'KYC Status': a.kyc?.status || 'pending',
            'Account Status': a.isActive ? 'Active' : 'Inactive',
            ...(isSubChild ? {} : { 'Sub-Child Count': a.childCount ?? 0 }),
            Whitelabels: a.whitelabelCount ?? 0, Customers: a.customerCount ?? 0,
            'Joined On': a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
          }
        }),
        isSubChild ? 'sub-child-agencies' : 'child-agencies',
        isSubChild ? 'Sub-Child Agencies' : 'Child Agencies'
      )
    } catch { toast.error('Export failed') }
    finally { setExportLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {agentRole === 'sub_child_agent'
              ? 'Manage and monitor tertiary distribution entities.'
              : 'Manage and monitor secondary distribution entities.'}
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <button type="button" onClick={() => setAgentFormModal({ open: true, mode: 'add', agent: null })}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add {agentRole === 'sub_child_agent' ? 'Sub-child' : 'Child'} Agency
          </button>
          <button type="button" onClick={handleExport} disabled={exportLoading || agents.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto">
            {exportLoading ? <Loader size="sm" /> : <Download size={16} strokeWidth={2} />}
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input type="search" placeholder="Search name, email, or phone…" autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 lg:flex lg:gap-3">
            <div className="w-full sm:min-w-[140px] lg:w-44">
              <CustomDropdown value={statusFilter} onChange={setStatusFilter}
                options={[{ value: 'all', label: 'All accounts' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                className="w-full" buttonClassName="!py-2" />
            </div>
            <div className="w-full sm:min-w-[140px] lg:w-44">
              <CustomDropdown value={kycFilter} onChange={setKycFilter}
                options={[{ value: 'all', label: 'All KYC' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]}
                className="w-full" buttonClassName="!py-2" />
            </div>
            <div className="w-full sm:min-w-[180px] lg:w-56">
              <CustomDropdown
                value={parentFilter}
                onChange={setParentFilter}
                options={parentOptions}
                className="w-full"
                buttonClassName="!py-2"
                searchable={true}
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
            <p className="mt-1 text-sm text-gray-500">Try adjusting search or status filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className={`w-full text-sm whitespace-nowrap ${agentRole === 'sub_child_agent' ? 'min-w-[980px]' : 'min-w-[1100px]'}`}>
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">
                      {agentRole === 'sub_child_agent' ? 'Sub-child agency' : 'Child agency'}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">
                      {agentRole === 'sub_child_agent' ? 'Child agency' : 'Parent agency'}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Contact</th>
                    {/* {agentRole !== 'sub_child_agent' ? (
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Sub-child</th>
                    ) : null} */}
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Whitelabels</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Customers</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
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
                            <div className="mt-1 text-[11px] font-medium text-primary-700">{agent.agentCode || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {(() => {
                          const parents = Array.isArray(agent.allParents) && agent.allParents.length > 0
                            ? agent.allParents
                            : agent.parentName ? [{ name: agent.parentName, agentCode: agent.parentCode }] : []
                          if (parents.length === 0) return <span className="text-xs text-gray-400">-</span>
                          if (parents.length === 1) return (
                            <div>
                              <p className="text-xs font-medium text-gray-900 leading-tight">{parents[0].name}</p>
                              <p className="text-[10px] text-gray-400">Code: {parents[0].agentCode || '-'}</p>
                            </div>
                          )
                          const parentsPath = agentRole === 'sub_child_agent'
                            ? `/admin/sub-child-agencies/${agent._id}/parents`
                            : `/admin/child-agencies/${agent._id}/parents`
                          return (
                            // <button type="button" onClick={() => navigate(parentsPath)}
                            //   className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                            //   title="View all parent agencies">
                            //   <Building2 className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                            //   <span className="tabular-nums">{parents.length}</span>
                              
                            // </button>
                             <div>
                              <p className="text-xs font-medium text-gray-900 leading-tight">{parents[0].name}</p>
                              <p className="text-[10px] text-gray-400">Code: {parents[0].agentCode || 'â€”'}</p>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-400">
                            <Phone className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{agent.phone || 'N/A'}</span>
                        </div>
                      </td>
                      {/* {agentRole !== 'sub_child_agent' ? (
                        <td className="px-4 py-2.5">
                          <button type="button" onClick={() => navigate(`/admin/sub-child-agencies?parentRef=${agent._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900">
                            <Users className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                            <span>{agent.childCount || 0}</span>
                          </button>
                        </td>
                      ) : null} */}
                      <td className="px-4 py-2.5">
                        <button type="button"
                          onClick={() => navigate(agentRole === 'sub_child_agent' ? `/admin/sub-child-agencies/${agent._id}/whitelabels` : `/admin/child-agencies/${agent._id}/whitelabels`)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium tabular-nums text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900">
                          <Layers className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                          <span>{agent.whitelabelCount ?? 0}</span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <button type="button" onClick={() => navigate(customersPathForAgent(agent._id))}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium tabular-nums text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900">
                          <UserRound className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                          <span>{agent.customerCount || 0}</span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <button type="button" disabled={togglingId === agent._id} onClick={() => handleToggleStatus(agent._id)}
                          className={`inline-flex min-w-[88px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                            agent.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90' : 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100/90'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-red-500'} ${agent.isActive ? 'animate-pulse' : ''}`} />
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <ParentApprovalBadge status={agent?.kyc?.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button"
                            onClick={() => { setSelectedAgent(agent); setIsDetailModalOpen(true) }}
                            className="inline-flex rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary-200 hover:text-primary-700 active:scale-95"
                            title="View agency"
                            aria-label={`View ${agent.name}`}>
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button type="button"
                            onClick={() => setAgentFormModal({ open: true, mode: 'edit', agent })}
                            className="inline-flex rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary-200 hover:text-primary-700 active:scale-95"
                            title="Edit agency"
                            aria-label={`Edit ${agent.name}`}>
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
                            className="inline-flex rounded-lg border border-violet-200 bg-violet-50 p-2 text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100 active:scale-95"
                            title="Network map this agency and downstream tree"
                            aria-label={`Hierarchy map for ${agent.name}`}
                          >
                            <GitBranch className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
          </>
        )}
      </div>

      <AgentDetailModal />

      {agentFormModal.open && (
        <AgentFormModal
          mode={agentFormModal.mode}
          agent={agentFormModal.agent}
          agentRole={agentRole}
          onClose={() => setAgentFormModal({ open: false, mode: 'add', agent: null })}
          onSaved={() => { setAgentFormModal({ open: false, mode: 'add', agent: null }); fetchAgents() }}
        />
      )}

      <Modal
        isOpen={hierarchyModal.open}
        onClose={() => setHierarchyModal((s) => ({ ...s, open: false }))}
        title={`Agency map Â· ${hierarchyModal.title || 'Agency'}`}
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
