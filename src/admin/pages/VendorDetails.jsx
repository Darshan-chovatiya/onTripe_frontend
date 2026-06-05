import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, Mail, Phone, MapPin, CheckCircle, XCircle, FileText, User, Building2, Calendar, LayoutDashboard } from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getFileUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}/${String(path).replace(/^\//, '')}`
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="min-w-0 text-sm text-gray-900 [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h3>
  )
}

export default function VendorDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const fetchVendor = async () => {
    try {
      const { data } = await adminApi.getVendorDetail(id)
      if (data?.success) {
        setVendor(data.data.vendor)
      } else {
        toastRef.current.error(data?.message || 'Vendor not found')
        navigate('/admin/vendors', { replace: true })
      }
    } catch (err) {
      toastRef.current.error(err?.response?.data?.message || 'Error fetching vendor')
      navigate('/admin/vendors', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchVendor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleToggleStatus = async () => {
    if (!vendor?._id || toggling) return
    setToggling(true)
    try {
      const { data } = await adminApi.toggleVendor(vendor._id)
      if (data?.success) {
        toastRef.current.success(data.message || 'Vendor status updated')
        if (data.data?.vendor) setVendor(data.data.vendor)
        else setVendor((v) => ({ ...v, isActive: !v.isActive }))
      } else {
        toastRef.current.error(data?.message || 'Could not update vendor status')
      }
    } catch (err) {
      toastRef.current.error(err?.response?.data?.message || 'Failed to update vendor status')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!vendor) return null

  const joinedDate = vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'

  return (
    <div className="animate-fade-in mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/vendors')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50" aria-label="Back">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Vendor details</h1>
          </div>
        </div>
      </div>

      {/* Summary card */}
      <section className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-3">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Store size={14} className="text-primary-500" /> Vendor name
            </p>
            <p className="text-lg font-bold text-gray-900">{vendor.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={toggling}
              title={vendor.isActive ? 'Click to deactivate' : 'Click to activate'}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-all active:scale-95 disabled:opacity-60 ${
                vendor.isActive
                  ? 'bg-emerald-50 text-emerald-900 ring-emerald-100 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-800 ring-red-100 hover:bg-red-100'
              }`}
            >
              {toggling ? (
                <Loader size="sm" />
              ) : (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${vendor.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </>
              )}
            </button>
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 bg-blue-50 text-blue-800 ring-blue-100">
              {vendor.type || 'Unknown'}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: User, label: 'Contact Person', value: vendor.contactPerson || '—' },
            { icon: Phone, label: 'Phone', value: vendor.phone || '—' },
            { icon: Mail, label: 'Email', value: vendor.email || '—' },
            { icon: Calendar, label: 'Joined On', value: joinedDate },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500"><Icon className="h-3.5 w-3.5 shrink-0" /> {label}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5">
          <SectionTitle icon={MapPin}>Location</SectionTitle>
          <DetailRow label="Address">{vendor.address || '—'}</DetailRow>
          <DetailRow label="City">{vendor.city || '—'}</DetailRow>
          <DetailRow label="State">{vendor.state || '—'}</DetailRow>
          <DetailRow label="Country">{vendor.country || '—'}</DetailRow>
        </div>
      </section>

      {/* Documents */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={FileText}>Documents</SectionTitle>
        {vendor.docs && vendor.docs.length > 0 ? (
          <ul className="space-y-2">
            {vendor.docs.map((doc, i) => {
              const href = getFileUrl(doc)
              return (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-gray-900">Document {i + 1}</span>
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-700 hover:underline">Open file</a> : <span className="text-xs text-gray-400">No file</span>}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
        )}
      </section>

      {/* Managed By */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Building2}>Managed by</SectionTitle>
        {typeof vendor.createdBy === 'object' && vendor.createdBy ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <p className="font-semibold text-gray-900">{vendor.createdBy.name || '—'}</p>
            <p className="mt-1 text-sm text-gray-600">{vendor.createdBy.email || ''}</p>
            {vendor.createdBy.phone && <p className="mt-1 text-sm text-gray-600">{vendor.createdBy.phone}</p>}
            {vendor.createdBy.role && <p className="mt-2 text-xs uppercase tracking-wide text-gray-400 font-bold text-primary-600">{String(vendor.createdBy.role).replace(/_/g, ' ')}</p>}
          </div>
        ) : <p className="text-sm text-gray-500">—</p>}
      </section>
    </div>
  )
}
