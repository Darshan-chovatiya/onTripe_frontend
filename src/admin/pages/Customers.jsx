import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Mail, Phone, Building2, Download, Pencil, Camera, X, Save } from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getFileUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}/${String(path).replace(/^\//, '')}`
}

// ── Edit Modal ───────────────────────────────────────────────────────────────
function EditCustomerModal({ customer, onClose, onSaved }) {
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(customer.profileImage ? getFileUrl(customer.profileImage) : null)
  const [pendingImageFile, setPendingImageFile] = useState(null) // file selected but not yet uploaded
  const [removePhoto, setRemovePhoto] = useState(false)         // user wants to remove existing photo

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Must be 10 digits'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    setErrors(e)
    return !Object.keys(e).length
  }

  // Just set local preview — no API call yet
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImageFile(file)
    setRemovePhoto(false)
    setPreviewUrl(URL.createObjectURL(file))
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    setPreviewUrl(null)
    setPendingImageFile(null)
    setRemovePhoto(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      // 1. Update text fields
      const res = await adminApi.updateCustomer(customer._id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(removePhoto ? { profileImage: '' } : {}),
      })
      if (!res?.data?.success) {
        toast.error(res?.data?.message || 'Update failed')
        return
      }
      let updated = res.data.data.customer

      // 2. Upload new photo if one was selected
      if (pendingImageFile) {
        try {
          const imgRes = await adminApi.uploadCustomerProfileImage(customer._id, pendingImageFile)
          if (imgRes?.data?.success) {
            updated = { ...updated, profileImage: imgRes.data.data.profileImage }
          }
        } catch (imgErr) {
          toast.error(imgErr?.response?.data?.message || 'Photo upload failed')
        }
      }

      toast.success('Customer updated')
      onSaved(updated)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const initials = (form.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary-600" strokeWidth={2} />
            <h2 className="text-sm font-bold text-gray-900">Edit Customer</h2>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Profile photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-2xl font-black text-white shadow-md ring-4 ring-white">
                {previewUrl
                  ? <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                  : initials
                }
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 shadow-md transition hover:bg-primary-700">
                <Camera className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </button>
              {previewUrl && (
                <button type="button" onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow transition hover:bg-red-600">
                  <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-primary-600 hover:text-primary-800 transition">
              {pendingImageFile ? 'Change selected photo' : previewUrl ? 'Change photo' : 'Add photo'}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Full Name *</label>
              <input type="text" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-field w-full" placeholder="Customer name" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input type="tel" inputMode="numeric" maxLength={10} value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                  className="input-field w-full pl-9" placeholder="10-digit number" />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field w-full pl-9" placeholder="email@example.com" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="w-full sm:flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60">
                {saving
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  : <Save className="h-4 w-4" strokeWidth={2.5} />
                }
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [exportLoading, setExportLoading] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // customer being edited
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [agents, setAgents] = useState([])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.listCustomers({
        page,
        limit: 10,
        agencyId: agencyFilter === 'all' ? undefined : agencyFilter,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      const payload = data?.data
      if (data?.success && payload) {
        const rows = Array.isArray(payload.customers) ? payload.customers : []
        setCustomers(rows)
        const tp = payload.totalPages
        setTotalPages(typeof tp === 'number' && tp > 0 ? tp : 1)
        setTotal(typeof payload.totalCount === 'number' ? payload.totalCount : 0)
      } else {
        setCustomers([])
        setTotalPages(1)
        toastRef.current.error(data?.message || 'Could not load customers')
      }
    } catch (err) {
      setCustomers([])
      setTotalPages(1)
      toastRef.current.error(err?.response?.data?.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, agencyFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  useEffect(() => {
    adminApi.listAgents({ limit: 1000 })
      .then(res => setAgents(res.data?.data?.agents || []))
      .catch(err => console.error('Failed to fetch agents', err))
  }, [])

  const profileCount = (c) => (Array.isArray(c.agencyProfiles) ? c.agencyProfiles.length : 0)

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listCustomers({ 
        page: 1, 
        limit: 10000, 
        agencyId: agencyFilter === 'all' ? undefined : agencyFilter,
        ...(debouncedSearch ? { search: debouncedSearch } : {}) 
      })
      await exportToExcel(
        (data?.data?.customers ?? []).map((c) => ({
          Name: c.name || '', Email: c.email || '', Phone: c.phone || '',
          'Agency Profiles': Array.isArray(c.agencyProfiles) ? c.agencyProfiles.length : 0,
          'Joined On': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        })),
        'customers', 'Customers'
      )
    } catch { toastRef.current.error('Export failed') }
    finally { setExportLoading(false) }
  }

  // Update a single customer in the list after edit
  const handleSaved = (updated) => {
    setCustomers(prev => prev.map(c => c._id === updated._id ? { ...c, ...updated } : c))
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Platform traveler registry — search by name, email, or phone.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading || customers.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          {exportLoading ? <Loader size="sm" /> : <Download size={16} strokeWidth={2} />}
          Export
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search name, email, or phone…"
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-200"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-72">
            <CustomDropdown
              value={agencyFilter}
              onChange={(val) => {
                setAgencyFilter(val)
                setPage(1)
              }}
              options={[
                { value: 'all', label: 'All Agencies' },
                ...agents.map(a => ({ value: a._id, label: `${a.name} (${a.agentCode})` }))
              ]}
              searchable={true}
              placeholder="Filter by Agency"
              truncateLength={40}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size="lg" />
            <p className="mt-4 text-xs text-gray-500">Loading customers…</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No customers found</p>
            <p className="mt-1 text-sm text-gray-500">Try another search.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Agencies</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Mobile</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Joined</th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Profiles</th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map((c) => {
                    const initials = (c.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const imgUrl = c.profileImage ? getFileUrl(c.profileImage) : null
                    return (
                      <tr key={c._id} className="group transition-colors hover:bg-gray-50/60">
                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[11px] font-bold text-white shadow-sm">
                              {imgUrl
                                ? <img src={imgUrl} alt={c.name} className="h-full w-full object-cover" />
                                : initials
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">{c.name || 'Unnamed'}</p>
                            </div>
                          </div>
                        </td>
                        {/* Agencies */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {Array.isArray(c.agencyProfiles) && c.agencyProfiles.length > 0 ? (
                              c.agencyProfiles.map((p, idx) => (
                                <span key={idx} className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                  {p.managedBy?.name || '—'}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">No linked agencies</span>
                            )}
                          </div>
                        </td>
                        {/* Email */}
                        <td className="max-w-[200px] px-5 py-3.5">
                          {c.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                              <span className="truncate text-xs text-gray-700" title={c.email}>{c.email}</span>
                            </div>
                          ) : null}
                        </td>
                        {/* Phone */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                            <span className="text-xs font-medium text-gray-900">{c.phone || '—'}</span>
                          </div>
                        </td>
                        {/* Joined */}
                        <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-500">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        {/* Agency profiles */}
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/customers/${c._id}`)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
                            title="View agency profiles"
                          >
                            <Building2 className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                            <span className="tabular-nums">{profileCount(c)}</span>
                          </button>
                        </td>
                        {/* Edit */}
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setEditTarget(c)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
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

      {editTarget && (
        <EditCustomerModal
          customer={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { handleSaved(updated); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
