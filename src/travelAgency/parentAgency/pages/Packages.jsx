import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, MapPin, Clock, Users, IndianRupee,
  Edit2, ImageIcon, ImagePlus, MessageSquare, LayoutGrid,
  List, TrendingUp, Package, CheckCircle2, XCircle,
  Calendar, Star, Eye, Copy, Trash2
} from 'lucide-react'
import { usePackages } from '@/travelAgency/parentAgency/hooks/usePackages.js'
import PackageFormModal from '@/travelAgency/parentAgency/components/PackageFormModal.jsx'
import PackageImageModal from '@/travelAgency/parentAgency/components/PackageImageModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import WhitelabelAgentsModal from '@/shared/components/WhitelabelAgentsModal.jsx'
import AgentCommissionsModal from '@/shared/components/AgentCommissionsModal.jsx'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

const imgUrl = (p) => {
  if (!p) return null
  if (p.startsWith('http')) return p
  return `${BASE_URL}/${String(p).replace(/^\//, '')}`
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600'

function StatusPill({ isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition active:scale-95 ${isActive
          ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-400/40 hover:bg-emerald-500/20'
          : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-200'
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
      {isActive ? 'Live' : 'Paused'}
    </button>
  )
}

function PackageGridCard({ pkg, onEdit, onClone, onCover, onGallery, onToggle, onDelete, onShowAgents, onShowCommissions, navigate }) {
  const cover = imgUrl(pkg.coverImage)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5">
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={cover || PLACEHOLDER}
          alt={pkg.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status pill top-right */}
        <div className="absolute right-3 top-3">
          <button type="button" onClick={() => onToggle(pkg)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm transition active:scale-95 ${
              pkg.isActive
                ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                : 'bg-black/50 text-white/80 hover:bg-black/70'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
            {pkg.isActive ? 'Live' : 'Paused'}
          </button>
        </div>

        {/* Price bottom-left */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-0.5 rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
            <IndianRupee className="h-3.5 w-3.5 text-primary-700" strokeWidth={2.5} />
            <span className="text-sm font-bold tabular-nums text-primary-900">
              {(Number(pkg.basePrice) || 0).toLocaleString('en-IN')}
            </span>
            <span className="ml-1 text-[10px] text-gray-500">{pkg.currency || 'INR'}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title + destination */}
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{pkg.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {pkg.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                {pkg.destination}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" strokeWidth={2} />
              {pkg.totalDays}d
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" strokeWidth={2} />
              {pkg.maxCapacity} max
            </span>
            {pkg.itinerary?.length > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" strokeWidth={2} />
                {pkg.itinerary.length} days
              </span>
            )}
          </div>
        </div>

        {/* Stats row — 4 numbers inline */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/60">
          <div className="px-2 py-2.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Earnings</p>
            <p className="mt-0.5 text-xs font-bold tabular-nums text-primary-700">
              ₹{(Number(pkg.totalParentEarnings) || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="px-2 py-2.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Child</p>
            <button type="button" onClick={() => onShowCommissions?.(pkg)}
              className="mt-0.5 block w-full text-xs font-bold tabular-nums text-emerald-700 hover:underline">
              ₹{(Number(pkg.totalChildEarnings) || 0).toLocaleString('en-IN')}
            </button>
          </div>
          <div className="px-2 py-2.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Bookings</p>
            <button type="button"
              onClick={() => navigate(`${AGENCY_PANEL_BASE}/bookings?packageId=${pkg._id}`)}
              className="mt-0.5 block w-full text-xs font-bold tabular-nums text-primary-600 hover:underline">
              {(Number(pkg.bookingCount) || 0) + (Number(pkg.totalAdditionalTravelers) || 0)}
            </button>
          </div>
          <div className="px-2 py-2.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">WL</p>
            <button type="button" disabled={!pkg.whitelabelCount} onClick={() => onShowAgents?.(pkg)}
              className={`mt-0.5 block w-full text-xs font-bold tabular-nums transition ${pkg.whitelabelCount ? 'text-violet-600 hover:underline' : 'text-gray-400'}`}>
              {Number(pkg.whitelabelCount) || 0}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          {/* Primary CTA */}
          <button type="button"
            onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`)}
            className="w-full rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 active:scale-[0.98]">
            View details
          </button>

          {/* Secondary actions — icon buttons only */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onEdit(pkg)} title="Edit"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
              <Edit2 className="h-4 w-4" strokeWidth={2} />
              Edit
            </button>
            <button type="button" onClick={() => onClone(pkg)} title="Clone"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700">
              <Copy className="h-4 w-4" strokeWidth={2} />
              Clone
            </button>
            <button type="button" onClick={() => onCover(pkg)} title="Cover"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
              <ImageIcon className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={() => onGallery(pkg)} title="Gallery"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
              <ImagePlus className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button"
              onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}/community?title=${encodeURIComponent(pkg.title || '')}`)}
              title="Chat"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
              <MessageSquare className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={() => onDelete(pkg)} title="Delete"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 bg-white text-red-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function PackageListRow({ pkg, onEdit, onClone, onCover, onGallery, onToggle, onDelete, onShowAgents, onShowCommissions, navigate }) {
  const cover = imgUrl(pkg.coverImage)
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-100 hover:shadow-md">
      {/* Thumbnail */}
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <img
          src={cover || PLACEHOLDER}
          alt={pkg.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-gray-900">{pkg.title}</h3>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {pkg.destination && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-400" strokeWidth={2} />{pkg.destination}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" strokeWidth={2} />{pkg.totalDays} days
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-gray-400" strokeWidth={2} />{pkg.maxCapacity} max
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden items-center gap-4 lg:flex">
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">My Earnings</p>
          <p className="mt-0.5 text-xs font-bold tabular-nums text-primary-700">
            ₹{(Number(pkg.totalParentEarnings) || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Child Comm.</p>
          <button
            type="button"
            onClick={() => onShowCommissions?.(pkg)}
            className="mt-0.5 inline-block text-xs font-bold tabular-nums text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            ₹{(Number(pkg.totalChildEarnings) || 0).toLocaleString('en-IN')}
          </button>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Bookings</p>
          <button
            type="button"
            onClick={() => navigate(`${AGENCY_PANEL_BASE}/bookings?packageId=${pkg._id}`)}
            className="mt-0.5 inline-block text-xs font-bold tabular-nums text-primary-600 hover:text-primary-800 hover:underline"
          >
            {(Number(pkg.bookingCount) || 0) + (Number(pkg.totalAdditionalTravelers) || 0)}
          </button>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Whitelabels</p>
          <button
            type="button"
            disabled={!pkg.whitelabelCount}
            onClick={() => onShowAgents?.(pkg)}
            className={`mt-0.5 inline-block text-xs font-bold tabular-nums transition ${pkg.whitelabelCount ? 'text-violet-600 hover:text-violet-800 hover:underline' : 'text-gray-400'}`}
          >
            {Number(pkg.whitelabelCount) || 0}
          </button>
        </div>
      </div>

      {/* Actions — single row */}
      <div className="flex shrink-0 items-center gap-1" style={{ minWidth: '280px', justifyContent: 'flex-end' }}>
        <button type="button" title="View details"
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button type="button" title="Edit"
          onClick={() => onEdit(pkg)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
          <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button type="button" title="Clone"
          onClick={() => onClone(pkg)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700">
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button type="button" title="Update cover"
          onClick={() => onCover(pkg)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
          <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button type="button" title="Update gallery"
          onClick={() => onGallery(pkg)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
          <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button type="button" title="Community chat"
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}/community?title=${encodeURIComponent(pkg.title || '')}`)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button type="button" onClick={() => onToggle(pkg)}
          title={pkg.isActive ? 'Pause package' : 'Activate package'}
          className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-[10px] font-bold transition ${
            pkg.isActive
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          {pkg.isActive ? 'Live' : 'Paused'}
        </button>
        <button type="button" title="Delete"
          onClick={() => onDelete(pkg)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-white text-red-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default function Packages() {
  const { packages, loading, error, create, update, updateCover, updateGallery, deactivate, activate, remove } = usePackages()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [formModal, setFormModal] = useState({ open: false, data: null, isClone: false })
  const [imageModal, setImageModal] = useState({ open: false, pkg: null, mode: 'cover' })
  const [confirmToggle, setConfirmToggle] = useState({ open: false, pkg: null })
  const [confirmDelete, setConfirmDelete] = useState({ open: false, pkg: null })
  const [agentsModal, setAgentsModal] = useState({ open: false, agents: [], title: '' })
  const [commissionsModal, setCommissionsModal] = useState({ open: false, data: [], individualBookings: [], whitelabelAgents: [], title: '', basePrice: 0 })
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    let list = packages
    if (statusFilter === 'active') list = list.filter((p) => p.isActive)
    if (statusFilter === 'inactive') list = list.filter((p) => !p.isActive)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.destination || '').toLowerCase().includes(q)
    )
    return list
  }, [packages, search, statusFilter])

  const stats = useMemo(() => ({
    total: packages.length,
    live: packages.filter((p) => p.isActive).length,
    revenue: packages.reduce((s, p) => s + (Number(p.totalRevenue) || 0), 0),
    bookings: packages.reduce((s, p) => s + (Number(p.bookingCount) || 0) + (Number(p.totalAdditionalTravelers) || 0), 0),
  }), [packages])

  const handleFormSubmit = async (formData) => {
    setSubmitting(true)
    try {
      await create(formData)
      toast.success('Package cloned')
      setFormModal({ open: false, data: null, isClone: false })
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleImageSubmit = async (formData) => {
    setSubmitting(true)
    try {
      if (imageModal.mode === 'cover') { await updateCover(imageModal.pkg._id, formData); toast.success('Cover updated') }
      else { await updateGallery(imageModal.pkg._id, formData); toast.success('Gallery updated') }
      setImageModal({ open: false, pkg: null, mode: 'cover' })
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleToggle = async () => {
    const pkg = confirmToggle.pkg
    if (!pkg) return
    try {
      if (pkg.isActive) { await deactivate(pkg._id); toast.success('Package paused') }
      else { await activate(pkg._id); toast.success('Package activated') }
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setConfirmToggle({ open: false, pkg: null }) }
  }

  const handleDelete = async () => {
    const pkg = confirmDelete.pkg
    if (!pkg) return
    try {
      await remove(pkg._id)
      toast.success('Package deleted')
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setConfirmDelete({ open: false, pkg: null }) }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Packages</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage your travel packages.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/agency/packages/create')}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-900/20 transition hover:bg-primary-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New package
        </button>
      </div>

      {/* ── Stats strip ── */}
      {packages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total packages', value: stats.total, icon: Package, color: 'text-primary-700', bg: 'bg-primary-50' },
            { label: 'Live', value: stats.live, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Total revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-sky-700', bg: 'bg-sky-50' },
            { label: 'Total bookings', value: stats.bookings, icon: Calendar, color: 'text-violet-700', bg: 'bg-violet-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500">{label}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Filters + view toggle ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search by title or destination…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {[['all', 'All'], ['active', 'Live'], ['inactive', 'Paused']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setStatusFilter(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === v ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {l}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
              title="List view"
            >
              <List className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader size="lg" />
          <p className="mt-4 text-sm text-gray-400">Loading packages…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <Package className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {packages.length === 0 ? 'No packages yet' : 'No matches found'}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500">
            {packages.length === 0
              ? 'Create your first package with destinations, pricing, and a day-by-day itinerary.'
              : 'Try adjusting your search or filter.'}
          </p>
          {packages.length === 0 && (
            <button
              type="button"
              onClick={() => navigate('/agency/packages/create')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Create package
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pkg) => (
            <PackageGridCard
              key={pkg._id}
              pkg={pkg}
              navigate={navigate}
              onEdit={(p) => navigate(`/agency/packages/edit/${p._id}`)}
              onClone={(p) => navigate(`/agency/packages/clone/${p._id}`)}
              onCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
              onGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
              onToggle={(p) => setConfirmToggle({ open: true, pkg: p })}
              onDelete={(p) => setConfirmDelete({ open: true, pkg: p })}
              onShowAgents={(p) => setAgentsModal({ open: true, agents: p.whitelabelAgents || [], title: `Agents who whitelabeled "${p.title}"` })}
              onShowCommissions={(p) => setCommissionsModal({ open: true, data: p.agentEarningsBreakdown || [], individualBookings: p.individualBookings || [], whitelabelAgents: p.whitelabelAgents || [], title: `Financial Breakdown: ${p.title}`, basePrice: p.basePrice })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => (
            <PackageListRow
              key={pkg._id}
              pkg={pkg}
              navigate={navigate}
              onEdit={(p) => navigate(`/agency/packages/edit/${p._id}`)}
              onClone={(p) => navigate(`/agency/packages/clone/${p._id}`)}
              onCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
              onGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
              onToggle={(p) => setConfirmToggle({ open: true, pkg: p })}
              onDelete={(p) => setConfirmDelete({ open: true, pkg: p })}
              onShowAgents={(p) => setAgentsModal({ open: true, agents: p.whitelabelAgents || [], title: `Agents who whitelabeled "${p.title}"` })}
              onShowCommissions={(p) => setCommissionsModal({ open: true, data: p.agentEarningsBreakdown || [], individualBookings: p.individualBookings || [], whitelabelAgents: p.whitelabelAgents || [], title: `Financial Breakdown: ${p.title}`, basePrice: p.basePrice })}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}

      <PackageImageModal
        isOpen={imageModal.open}
        onClose={() => setImageModal({ open: false, pkg: null, mode: 'cover' })}
        pkg={imageModal.pkg}
        onSubmit={handleImageSubmit}
        mode={imageModal.mode}
        loading={submitting}
      />
      <ConfirmDialog
        isOpen={confirmToggle.open}
        onClose={() => setConfirmToggle({ open: false, pkg: null })}
        onConfirm={handleToggle}
        title={confirmToggle.pkg?.isActive ? 'Pause package?' : 'Activate package?'}
        message={
          confirmToggle.pkg?.isActive
            ? `"${confirmToggle.pkg?.title}" will be hidden from your network and linked whitelabels will be deactivated.`
            : `"${confirmToggle.pkg?.title}" will be visible to your network again.`
        }
        confirmText={confirmToggle.pkg?.isActive ? 'Pause' : 'Activate'}
        cancelText="Cancel"
        variant={confirmToggle.pkg?.isActive ? 'danger' : 'primary'}
      />

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, pkg: null })}
        onConfirm={handleDelete}
        title="Delete package?"
        message={`Are you sure you want to delete "${confirmDelete.pkg?.title}"? This will remove it from your list and all linked whitelabels. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <WhitelabelAgentsModal
        isOpen={agentsModal.open}
        onClose={() => setAgentsModal({ open: false, agents: [], title: '' })}
        agents={agentsModal.agents}
        title={agentsModal.title}
      />

      <AgentCommissionsModal
        isOpen={commissionsModal.open}
        onClose={() => setCommissionsModal({ open: false, data: [], individualBookings: [], title: '' })}
        data={commissionsModal.data}
        individualBookings={commissionsModal.individualBookings}
        whitelabelAgents={commissionsModal.whitelabelAgents}
        basePrice={commissionsModal.basePrice}
        title={commissionsModal.title}
      />
    </div>
  )
}
